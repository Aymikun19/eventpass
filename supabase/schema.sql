-- Everything lives in the "eventpass" schema so this app can share a Supabase project with others.
-- After running, add "eventpass" under Supabase → Project Settings → Data API → Exposed schemas.
create schema if not exists eventpass;
grant usage on schema eventpass to anon, authenticated, service_role;
alter default privileges in schema eventpass grant all on tables to anon, authenticated, service_role;
alter default privileges in schema eventpass grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema eventpass grant execute on functions to anon, authenticated, service_role;

-- EventPass schema. Run in the Supabase SQL editor.

create table eventpass.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade default auth.uid(),
  slug text not null unique,
  title text not null,
  description text,
  venue text,
  starts_at timestamptz not null,
  capacity int not null default 100 check (capacity > 0),
  created_at timestamptz not null default now()
);

create table eventpass.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references eventpass.events on delete cascade,
  name text not null,
  email text not null,
  ticket_code uuid not null unique default gen_random_uuid(),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

alter table eventpass.events enable row level security;
alter table eventpass.registrations enable row level security;

-- Anyone can view an event page; only the owner can change it.
create policy "events are public" on eventpass.events for select using (true);
create policy "owner inserts" on eventpass.events for insert with check (owner_id = auth.uid());
create policy "owner updates" on eventpass.events for update using (owner_id = auth.uid());
create policy "owner deletes" on eventpass.events for delete using (owner_id = auth.uid());

-- Only the event owner can read or check in registrations.
create policy "owner reads registrations" on eventpass.registrations for select
  using (exists (select 1 from eventpass.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "owner updates registrations" on eventpass.registrations for update
  using (exists (select 1 from eventpass.events e where e.id = event_id and e.owner_id = auth.uid()));

-- Public registration goes through this function so capacity is enforced atomically.
create function eventpass.register_for_event(p_slug text, p_name text, p_email text)
returns table (ticket_code uuid, event_title text, already_registered boolean)
language plpgsql security definer set search_path = '' as $$
declare
  ev eventpass.events;
  taken int;
  existing uuid;
begin
  select * into ev from eventpass.events where slug = p_slug for update;
  if not found then raise exception 'Event not found'; end if;
  if ev.starts_at < now() then raise exception 'Registration has closed'; end if;

  select r.ticket_code into existing from eventpass.registrations r
    where r.event_id = ev.id and lower(r.email) = lower(p_email);
  if existing is not null then
    return query select existing, ev.title, true; return;
  end if;

  select count(*) into taken from eventpass.registrations r where r.event_id = ev.id;
  if taken >= ev.capacity then raise exception 'This event is full'; end if;

  return query
    insert into eventpass.registrations (event_id, name, email)
    values (ev.id, trim(p_name), lower(trim(p_email)))
    returning registrations.ticket_code, ev.title, false;
end $$;

grant execute on function eventpass.register_for_event to anon, authenticated;

-- Public ticket lookup (only exposes what is printed on the ticket).
create function eventpass.get_ticket(p_code uuid)
returns table (name text, event_title text, venue text, starts_at timestamptz, checked_in_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.name, e.title, e.venue, e.starts_at, r.checked_in_at
  from eventpass.registrations r join eventpass.events e on e.id = r.event_id
  where r.ticket_code = p_code;
$$;

grant execute on function eventpass.get_ticket to anon, authenticated;

-- Table access is still governed by the RLS policies above.
grant all on all tables in schema eventpass to anon, authenticated, service_role;
grant all on all sequences in schema eventpass to anon, authenticated, service_role;
grant execute on all functions in schema eventpass to anon, authenticated, service_role;
