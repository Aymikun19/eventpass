-- 002: waitlist when an event is full, and attendees can cancel their own ticket.
-- Cancelling a confirmed ticket automatically promotes the first person on the waitlist.

alter table eventpass.registrations
  add column if not exists status text not null default 'confirmed',
  add column if not exists status_changed_at timestamptz not null default now();
alter table eventpass.registrations drop constraint if exists registrations_status_check;
alter table eventpass.registrations add constraint registrations_status_check check (status in ('confirmed', 'waitlisted', 'cancelled'));
create index if not exists registrations_waitlist on eventpass.registrations (event_id, status, created_at);

drop function if exists eventpass.register_for_event(text, text, text);
create function eventpass.register_for_event(p_slug text, p_name text, p_email text)
returns table (ticket_code uuid, event_title text, already_registered boolean, waitlisted boolean)
language plpgsql security definer set search_path = '' as $$
declare
  ev eventpass.events;
  taken int;
  r eventpass.registrations;
  full_now boolean;
begin
  select * into ev from eventpass.events where slug = p_slug for update;
  if not found then raise exception 'Event not found'; end if;
  if ev.starts_at < now() then raise exception 'Registration has closed'; end if;
  select count(*) into taken from eventpass.registrations x where x.event_id = ev.id and x.status = 'confirmed';
  full_now := taken >= ev.capacity;

  select * into r from eventpass.registrations x where x.event_id = ev.id and lower(x.email) = lower(p_email);
  if r.id is not null and r.status <> 'cancelled' then
    return query select r.ticket_code, ev.title, true, r.status = 'waitlisted'; return;
  end if;
  if r.id is not null then
    -- Coming back after cancelling: same ticket, back in line.
    update eventpass.registrations set status = case when full_now then 'waitlisted' else 'confirmed' end,
      status_changed_at = now(), name = trim(p_name), created_at = now()
    where id = r.id;
    return query select r.ticket_code, ev.title, false, full_now; return;
  end if;
  return query
    insert into eventpass.registrations (event_id, name, email, status)
    values (ev.id, trim(p_name), lower(trim(p_email)), case when full_now then 'waitlisted' else 'confirmed' end)
    returning registrations.ticket_code, ev.title, false, full_now;
end $$;

drop function if exists eventpass.get_ticket(uuid);
create function eventpass.get_ticket(p_code uuid)
returns table (name text, event_title text, venue text, starts_at timestamptz, checked_in_at timestamptz, status text, waitlist_position int, slug text)
language sql stable security definer set search_path = '' as $$
  select r.name, e.title, e.venue, e.starts_at, r.checked_in_at, r.status,
    case when r.status = 'waitlisted' then (
      select count(*)::int from eventpass.registrations w
      where w.event_id = r.event_id and w.status = 'waitlisted' and w.created_at <= r.created_at
    ) end,
    e.slug
  from eventpass.registrations r join eventpass.events e on e.id = r.event_id
  where r.ticket_code = p_code;
$$;

-- The ticket code is the attendee's secret, so holding it is enough to cancel.
create or replace function eventpass.cancel_registration(p_code uuid)
returns table (promoted_code uuid, promoted_name text, promoted_email text, event_title text, venue text, starts_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare r eventpass.registrations; ev eventpass.events; nxt eventpass.registrations;
begin
  select * into r from eventpass.registrations where ticket_code = p_code for update;
  if r.id is null then raise exception 'Ticket not found'; end if;
  select * into ev from eventpass.events where id = r.event_id for update;
  if r.checked_in_at is not null then raise exception 'This ticket was already used at the door'; end if;
  if r.status = 'cancelled' then return; end if;
  update eventpass.registrations set status = 'cancelled', status_changed_at = now() where id = r.id;
  if r.status = 'confirmed' and ev.starts_at > now() then
    select * into nxt from eventpass.registrations
    where event_id = r.event_id and status = 'waitlisted' order by created_at limit 1 for update skip locked;
    if nxt.id is not null then
      update eventpass.registrations set status = 'confirmed', status_changed_at = now() where id = nxt.id;
      return query select nxt.ticket_code, nxt.name, nxt.email, ev.title, ev.venue, ev.starts_at;
    end if;
  end if;
end $$;

revoke all on function eventpass.cancel_registration(uuid) from public;
grant execute on function eventpass.register_for_event(text, text, text), eventpass.get_ticket(uuid), eventpass.cancel_registration(uuid) to anon, authenticated;
