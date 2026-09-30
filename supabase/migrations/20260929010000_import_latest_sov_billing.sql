-- Import the latest supplied payment applications into the progressive SOV fields.
-- Purple Line: Pay App #9, period ending 2026-09-20.
update public.bid_work_items item
set previous_billing = source.previous_billing, current_billing = source.current_billing, stored_materials = source.stored_materials,
    retainage_amount = source.retainage, completion_status = source.completion_status,
    billing_application_number = '9', billing_period_to = date '2026-09-20', billing_source_document = 'Pay App #9.pdf', updated_at = now()
from public.bid_opportunities bid,
(values
  (1, 28986.50::numeric, 0.00::numeric, 0.00::numeric, 2173.99::numeric, 'completed'),
  (2, 86959.51::numeric, 0.00::numeric, 0.00::numeric, 6521.96::numeric, 'completed'),
  (3, 55100.00::numeric, 13742.95::numeric, 0.00::numeric, 5163.22::numeric, 'partially_completed'),
  (4, 14493.25::numeric, 0.00::numeric, 0.00::numeric, 1086.99::numeric, 'partially_completed'),
  (5, 0.00::numeric, 0.00::numeric, 0.00::numeric, 0.00::numeric, 'not_completed'),
  (6, 5108.29::numeric, 0.00::numeric, 0.00::numeric, 383.12::numeric, 'completed'),
  (7, 15324.88::numeric, 0.00::numeric, 0.00::numeric, 1149.37::numeric, 'completed'),
  (8, 12770.73::numeric, 0.00::numeric, 0.00::numeric, 957.80::numeric, 'completed'),
  (9, 12770.73::numeric, 0.00::numeric, 0.00::numeric, 957.80::numeric, 'completed'),
  (10, 5108.29::numeric, 0.00::numeric, 0.00::numeric, 383.12::numeric, 'completed'),
  (101, 4875.00::numeric, 0.00::numeric, 0.00::numeric, 365.63::numeric, 'partially_completed'),
  (102, 0.00::numeric, 0.00::numeric, 0.00::numeric, 0.00::numeric, 'not_completed'),
  (103, 4268.37::numeric, 0.00::numeric, 0.00::numeric, 320.13::numeric, 'completed'),
  (104, 31549.21::numeric, 0.00::numeric, 0.00::numeric, 2366.19::numeric, 'completed'),
  (105, 17875.00::numeric, 13000.00::numeric, 0.00::numeric, 2315.63::numeric, 'partially_completed')
) as source(sort_order, previous_billing, current_billing, stored_materials, retainage, completion_status)
where item.bid_opportunity_id = bid.id and bid.proposal_number = 'PLDB-SUB-372' and item.sort_order = source.sort_order;

-- Replace the Bladensburg aggregate original-contract rows with the exact Billing #33 SOV lines.
delete from public.bid_work_items item using public.bid_opportunities bid where item.bid_opportunity_id = bid.id and bid.project_name = 'WMATA Bladensburg Bid Package #5' and item.item_type = 'original_contract';

insert into public.bid_work_items (bid_opportunity_id, item_number, description, scheduled_value, item_type, sort_order, completion_status, previous_billing, current_billing, stored_materials, retainage_amount, billing_application_number, billing_period_to, billing_source_document, notes)
select bid.id, source.item_number, source.description, source.scheduled_value, 'original_contract', source.sort_order, source.completion_status, source.previous_billing, source.current_billing, 0, 0, '33', date '2026-09-14', 'PIWC Payment Application - 33.pdf', 'Imported from Billing #33 supplied September 29, 2026.'
from public.bid_opportunities bid cross join lateral (values
  ('1', 'Bond', 50000.00::numeric, 50000.00::numeric, 0.00::numeric, 1, 'completed'),
  ('2', 'Mobilization', 67800.00::numeric, 59000.00::numeric, 0.00::numeric, 2, 'partially_completed'),
  ('3', 'Shop drawings and engineering', 54999.00::numeric, 52874.50::numeric, 0.00::numeric, 3, 'partially_completed'),
  ('3A', 'Escalation allowance', 50000.00::numeric, 0.00::numeric, 0.00::numeric, 4, 'not_completed'),
  ('4', 'Floor grates at emergency eyewash / emergency shower', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 5, 'completed'),
  ('5', 'Floor grates at sweeper / scrubber', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 6, 'completed'),
  ('6', 'Floor grates at used oil / coolant and battery room', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 7, 'completed'),
  ('7', 'Trench drain grates (HS-20) at fueling lanes', 14980.00::numeric, 14980.00::numeric, 0.00::numeric, 8, 'completed'),
  ('8', 'Trench drain grates (HS-20) at bus wash lanes', 32000.00::numeric, 32000.00::numeric, 0.00::numeric, 9, 'completed'),
  ('9', 'Wash building water reclamation grate', 32000.00::numeric, 32000.00::numeric, 0.00::numeric, 10, 'completed'),
  ('10', 'Floor grates at chassis wash (HS-20)', 32000.00::numeric, 32000.00::numeric, 0.00::numeric, 11, 'completed'),
  ('11', 'Edge angle at skylift pits', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 12, 'completed'),
  ('12', 'Loading dock scissor lift pit', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 13, 'completed'),
  ('14', 'Lube / compressor room grating edge angle', 5670.00::numeric, 5670.00::numeric, 0.00::numeric, 14, 'completed'),
  ('15', 'Interior, exterior and site bollards — furnish and deliver only', 272680.00::numeric, 272680.00::numeric, 0.00::numeric, 15, 'completed'),
  ('16', 'Steel corner guards (CG-1) — furnish and deliver only', 30000.00::numeric, 30000.00::numeric, 0.00::numeric, 16, 'completed'),
  ('17', 'Steel plate column protection at parking garage columns (96)', 64000.00::numeric, 64000.00::numeric, 0.00::numeric, 17, 'completed'),
  ('18', 'Aluminum stair nosings — furnish and deliver only', 23000.00::numeric, 23000.00::numeric, 0.00::numeric, 18, 'completed'),
  ('19', 'Chassis wash floor grate tube support steel', 25000.00::numeric, 25000.00::numeric, 0.00::numeric, 19, 'completed'),
  ('20', 'Elevator miscellaneous steel', 26800.00::numeric, 17996.00::numeric, 880.00::numeric, 20, 'partially_completed'),
  ('21', 'Roof ladders at maintenance building (3)', 38000.00::numeric, 38000.00::numeric, 0.00::numeric, 21, 'completed'),
  ('22', 'Reel support steel', 204380.00::numeric, 204380.00::numeric, 0.00::numeric, 22, 'completed'),
  ('23', 'Steel guardrail and swing gate at patio', 20000.00::numeric, 20000.00::numeric, 0.00::numeric, 23, 'completed'),
  ('24', 'Metal pan stairs (Stairs 1, 2 and 3)', 410000.00::numeric, 410000.00::numeric, 0.00::numeric, 24, 'completed'),
  ('25', 'Exterior galvanized stairs (Stairs 1 and 3)', 29000.00::numeric, 29000.00::numeric, 0.00::numeric, 25, 'completed'),
  ('Phase I', 'Phase I retainage release', 98515.65::numeric, 98515.65::numeric, 0.00::numeric, 26, 'completed'),
  ('26', 'Furnish top-of-masonry wall angles and bracing — Detail 7/S-007', 50000.00::numeric, 50000.00::numeric, 0.00::numeric, 27, 'completed'),
  ('27', 'Install top-of-masonry wall angles and bracing — Detail 7/S-007', 50000.00::numeric, 50000.00::numeric, 0.00::numeric, 28, 'completed'),
  ('28', 'Furnish top-of-masonry wall angles and bracing — Detail 1/S-007', 4500.00::numeric, 4500.00::numeric, 0.00::numeric, 29, 'completed'),
  ('29', 'Install top-of-masonry wall angles and bracing — Detail 1/S-007', 4500.00::numeric, 4500.00::numeric, 0.00::numeric, 30, 'completed'),
  ('30', 'Furnish top-of-masonry wall angles and bracing — Detail 2/S-007', 12000.00::numeric, 12000.00::numeric, 0.00::numeric, 31, 'completed'),
  ('31', 'Install top-of-masonry wall angles and bracing — Detail 2/S-007', 12000.00::numeric, 12000.00::numeric, 0.00::numeric, 32, 'completed'),
  ('32', 'Railing at pedestrian bridge', 30000.00::numeric, 30000.00::numeric, 0.00::numeric, 33, 'completed'),
  ('33', 'Handrail and guardrail for parking garage stairs', 111000.00::numeric, 26920.59::numeric, 2777.78::numeric, 34, 'partially_completed'),
  ('34', 'Headache bar at parking garage ramp', 17800.00::numeric, 17800.00::numeric, 0.00::numeric, 35, 'completed'),
  ('35', 'Snow gates at parking garage (3)', 27000.00::numeric, 5400.00::numeric, 0.00::numeric, 36, 'partially_completed'),
  ('36', 'Operable partition support steel', 25000.00::numeric, 25000.00::numeric, 0.00::numeric, 37, 'completed'),
  ('37', 'U-shaped bollards for fueling lanes (8)', 6000.00::numeric, 6000.00::numeric, 0.00::numeric, 38, 'completed'),
  ('38', 'Tire racks (6) and severe-use workbenches (25)', 42000.00::numeric, 42000.00::numeric, 0.00::numeric, 39, 'completed'),
  ('39', 'All gratings except elevator miscellaneous steel', 122200.00::numeric, 122200.00::numeric, 0.00::numeric, 40, 'completed')
) as source(item_number, description, scheduled_value, previous_billing, current_billing, sort_order, completion_status)
where bid.project_name = 'WMATA Bladensburg Bid Package #5';

-- Refresh the existing Bladensburg change-order lines from Billing #33.
update public.bid_work_items item
set previous_billing = source.previous_billing, current_billing = source.current_billing, stored_materials = 0, retainage_amount = 0,
    completion_status = source.completion_status, billing_application_number = '33', billing_period_to = date '2026-09-14',
    billing_source_document = 'PIWC Payment Application - 33.pdf', notes = 'Imported from Billing #33 supplied September 29, 2026.', updated_at = now()
from public.bid_opportunities bid,
(values
  (201, 8727.00::numeric, 0.00::numeric, 'completed'),
  (202, 46187.00::numeric, 0.00::numeric, 'completed'),
  (203, 3979.00::numeric, 0.00::numeric, 'completed'),
  (204, 1569.00::numeric, 0.00::numeric, 'completed'),
  (205, -24316.00::numeric, 0.00::numeric, 'completed'),
  (206, 2951.00::numeric, 0.00::numeric, 'completed'),
  (207, -3972.00::numeric, 0.00::numeric, 'completed'),
  (208, 3281.00::numeric, 0.00::numeric, 'completed'),
  (209, 4282.00::numeric, 0.00::numeric, 'completed'),
  (210, 472.00::numeric, 0.00::numeric, 'completed'),
  (211, 7026.00::numeric, 0.00::numeric, 'completed'),
  (212, 7192.00::numeric, 0.00::numeric, 'completed'),
  (213, 2353.00::numeric, 0.00::numeric, 'completed'),
  (214, 25450.00::numeric, 0.00::numeric, 'completed'),
  (215, 14677.00::numeric, 0.00::numeric, 'completed'),
  (216, 1474.00::numeric, 0.00::numeric, 'completed'),
  (217, 4230.00::numeric, 0.00::numeric, 'completed'),
  (218, 717.00::numeric, 0.00::numeric, 'completed'),
  (219, 19228.00::numeric, 0.00::numeric, 'completed'),
  (220, 28489.00::numeric, 0.00::numeric, 'completed'),
  (221, 21192.00::numeric, 0.00::numeric, 'completed'),
  (222, 4711.00::numeric, 0.00::numeric, 'completed'),
  (223, 2021.00::numeric, 0.00::numeric, 'completed'),
  (224, 30438.95::numeric, 0.00::numeric, 'partially_completed'),
  (225, 2380.00::numeric, 0.00::numeric, 'completed'),
  (226, 1169.00::numeric, 0.00::numeric, 'completed'),
  (227, 1962.00::numeric, 0.00::numeric, 'completed'),
  (228, 6412.00::numeric, 0.00::numeric, 'completed'),
  (229, 4134.00::numeric, 0.00::numeric, 'completed'),
  (230, 18764.00::numeric, 0.00::numeric, 'completed'),
  (231, 1171.00::numeric, 0.00::numeric, 'completed'),
  (232, 8975.00::numeric, 0.00::numeric, 'completed'),
  (233, 56660.00::numeric, 0.00::numeric, 'completed'),
  (234, -50000.00::numeric, 0.00::numeric, 'completed'),
  (235, -16474.00::numeric, 0.00::numeric, 'completed'),
  (236, -906.00::numeric, 0.00::numeric, 'completed'),
  (237, -27000.00::numeric, 0.00::numeric, 'completed'),
  (238, -5000.00::numeric, 0.00::numeric, 'completed'),
  (239, -17000.00::numeric, 0.00::numeric, 'completed'),
  (240, 8400.00::numeric, 8400.00::numeric, 'partially_completed'),
  (241, 1700.00::numeric, 0.00::numeric, 'partially_completed'),
  (242, 6150.00::numeric, 1537.50::numeric, 'partially_completed'),
  (243, 9004.00::numeric, 9005.00::numeric, 'partially_completed')
) as source(sort_order, previous_billing, current_billing, completion_status)
where item.bid_opportunity_id = bid.id and bid.project_name = 'WMATA Bladensburg Bid Package #5' and item.sort_order = source.sort_order;

update public.bid_opportunities set estimated_contract_value = 606265.54, updated_at = now() where proposal_number = 'PLDB-SUB-372';
update public.bid_opportunities set estimated_contract_value = 2448657.65, updated_at = now() where project_name = 'WMATA Bladensburg Bid Package #5';
