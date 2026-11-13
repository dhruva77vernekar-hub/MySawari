-- Demo seed data for Belagavi. The rectangular polygon is an illustrative
-- hackathon service boundary, not an official municipal boundary.
insert into public.service_zones(name, city, polygon_geojson, is_active)
select 'Belagavi Demo Zone', 'Belagavi',
  '{"type":"Polygon","coordinates":[[[74.42,15.78],[74.62,15.78],[74.62,15.96],[74.42,15.96],[74.42,15.78]]]}'::jsonb,
  true
where not exists (
  select 1 from public.service_zones where name='Belagavi Demo Zone' and city='Belagavi'
);

-- Synthetic hourly history is explicitly labelled. It is only for a hackathon
-- forecast demonstration and must never be represented as real customer demand.
insert into public.demand_history(zone_id, bucket_start, request_count, source)
select z.id, hour_bucket,
  (case
    when extract(hour from hour_bucket) between 8 and 10 then 12
    when extract(hour from hour_bucket) between 17 and 20 then 16
    when extract(hour from hour_bucket) between 11 and 16 then 7
    else 2
  end + floor(random()*4)::integer),
  'simulated'
from public.service_zones z
cross join generate_series(
  date_trunc('hour', now() - interval '14 days'),
  date_trunc('hour', now()) - interval '1 hour',
  interval '1 hour'
) as hour_bucket
where z.name='Belagavi Demo Zone' and z.city='Belagavi'
on conflict(zone_id, bucket_start, source) do nothing;
