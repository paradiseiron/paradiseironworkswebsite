insert into public.bid_work_items
  (bid_opportunity_id, item_number, description, scheduled_value, sort_order)
select bid.id, item.item_number, item.description, item.scheduled_value, item.sort_order
from public.bid_opportunities bid
cross join lateral (values
  ('1', 'Submittals & Coordination - Shop drawings, engineering and coordination', 4400.00::numeric, 1),
  ('2', 'Material Procurement - Header steel, intermediate supports, hose reel plates and anchors', 9950.00::numeric, 2),
  ('3', 'Fabrication - Steel fabrication, delivery preparation, labeling and QA/QC', 7560.00::numeric, 3),
  ('4', 'Field Installation - Header and intermediate steel, hose reel plates and anchor drilling', 13930.00::numeric, 4),
  ('5', 'Field Verification and Adjustments', 2390.00::numeric, 5),
  ('6', 'Closeout - As-builts, final documentation and turnover package', 1570.00::numeric, 6)
) as item(item_number, description, scheduled_value, sort_order)
where bid.project_name ilike '%NIH Robotics Shop Renovation%'
and not exists (select 1 from public.bid_work_items existing where existing.bid_opportunity_id = bid.id);

insert into public.bid_work_items
  (bid_opportunity_id, item_number, description, scheduled_value, sort_order)
select bid.id, item.item_number, item.description, item.scheduled_value, item.sort_order
from public.bid_opportunities bid
cross join lateral (values
  ('1', 'Pedestrian Bridge Handrail - Pre-construction coordination, shop drawings and engineering', 28986.50::numeric, 1),
  ('2', 'Pedestrian Bridge Handrail - Procurement', 86959.51::numeric, 2),
  ('3', 'Pedestrian Bridge Handrail - Fabrication and storage', 72466.26::numeric, 3),
  ('4', 'Pedestrian Bridge Handrail - Installation', 72466.26::numeric, 4),
  ('5', 'Pedestrian Bridge Handrail - Closeout', 28986.51::numeric, 5),
  ('6', 'Rub Rail - Pre-construction coordination, shop drawings and engineering', 5108.29::numeric, 6),
  ('7', 'Rub Rail - Procurement', 15324.88::numeric, 7),
  ('8', 'Rub Rail - Fabrication and storage', 12770.73::numeric, 8),
  ('9', 'Rub Rail - Installation', 12770.73::numeric, 9),
  ('10', 'Rub Rail - Closeout', 5108.29::numeric, 10)
) as item(item_number, description, scheduled_value, sort_order)
where bid.project_name ilike '%Purple Line%'
and not exists (select 1 from public.bid_work_items existing where existing.bid_opportunity_id = bid.id);

insert into public.bid_work_items
  (bid_opportunity_id, item_number, description, scheduled_value, sort_order)
select bid.id, item.item_number, item.description, null, item.sort_order
from public.bid_opportunities bid
cross join lateral (values
  ('1', 'Bond and mobilization', 1),
  ('2', 'Shop drawings and engineering', 2),
  ('3', 'Bollards - furnish and deliver', 3),
  ('4', 'Floor and trench grates with edge angles', 4),
  ('5', 'Stairs, nosings and miscellaneous stair steel', 5),
  ('6', 'Elevator miscellaneous steel', 6),
  ('7', 'Exterior stairs and railings', 7),
  ('8', 'Reel support and miscellaneous support steel', 8),
  ('9', 'Handrails, guardrails and gates', 9),
  ('10', 'Roof ladders, wall angles and bracing', 10),
  ('11', 'Pedestrian bridge railing', 11),
  ('12', 'Equipment racks, workbenches and grating', 12)
) as item(item_number, description, sort_order)
where (bid.project_name ilike '%WMATA%' or bid.project_name ilike '%Bladensburg%')
and not exists (select 1 from public.bid_work_items existing where existing.bid_opportunity_id = bid.id);
