insert into public.bid_work_items (
  bid_opportunity_id, description, scheduled_value, item_type,
  change_order_number, change_order_approval_status, work_status,
  fabrication_complete, delivery_complete, installation_complete,
  ready_for_billing, ready_for_billing_at, notes, sort_order
)
select bid.id, item.description, item.amount, 'change_order', item.co_number,
  'approved', item.work_status, item.work_status <> 'not_started',
  item.work_status in ('delivery', 'installation', 'ready_for_billing', 'paid'),
  item.work_status in ('installation', 'ready_for_billing', 'paid'),
  item.work_status in ('ready_for_billing', 'paid'),
  case when item.work_status in ('ready_for_billing', 'paid') then now() else null end,
  'Imported from Payment Application #8; approval date was not shown in the provided document.',
  item.sort_order
from public.bid_opportunities bid
cross join lateral (values
  ('CO-1', 'Welding rates on an hourly basis; services as needed when requested by MTS', 25000.00::numeric, 'fabrication', 101),
  ('CO-2', 'Technical clarification to the agreement', 0.00::numeric, 'not_started', 102),
  ('CO-3', 'Cut and bevel one installed pile and one loose pile at Spring Street Bridge', 4268.37::numeric, 'ready_for_billing', 103),
  ('CO-4', 'Single line pipe rail near 8851 Garland Ave and 8648 Piney Branch Rd', 31549.21::numeric, 'ready_for_billing', 104),
  ('CO-5', 'Design, fabrication and installation of the TPSS Q2 Stair System', 204500.00::numeric, 'fabrication', 105)
) as item(co_number, description, amount, work_status, sort_order)
where bid.proposal_number = 'PLDB-SUB-372'
and not exists (
  select 1 from public.bid_work_items existing
  where existing.bid_opportunity_id = bid.id
    and existing.change_order_number = item.co_number
    and existing.description = item.description
);

insert into public.bid_work_items (
  bid_opportunity_id, description, scheduled_value, item_type,
  change_order_number, change_order_approval_status, work_status,
  fabrication_complete, delivery_complete, installation_complete,
  ready_for_billing, ready_for_billing_at, notes, sort_order
)
select bid.id, item.description, item.amount, 'change_order', item.co_number,
  'approved', 'ready_for_billing', true, true, true, true, now(),
  'Imported from PIWC Payment Application 32; approval date was not shown in the provided document.',
  item.sort_order
from public.bid_opportunities bid
cross join lateral (values
  ('CO-2', 'PIW E-4 SP - Additional bollards (9) per RFI 182-Z', 8727.00::numeric, 201),
  ('CO-2', 'PIW E-8 - Galvanize interior bollards (87) at pile cap or grade beam', 46187.00::numeric, 202),
  ('CO-2', 'PIW E-13 - Barrier frame between bollards at SP existing manhole per RFI 326-Z', 3979.00::numeric, 203),
  ('CO-3', 'PIW E-3R3 - Backcharge for unusable steel members', 1569.00::numeric, 204),
  ('CO-3', 'PIW E-9R1 - Deductive removal of Area 6 fuel lane trench drains', -24316.00::numeric, 205),
  ('CO-3', 'PIW E-10R2 - Added W8x24 steel lintels per RFI 059-Z', 2951.00::numeric, 206),
  ('CO-3', 'PIW E-14R1 - Deductive removal of Area 6 U-bollards', -3972.00::numeric, 207),
  ('CO-3', 'PIW E-18R - Furnish only 15 corner guards requested by WMATA', 3281.00::numeric, 208),
  ('CO-3', 'PIW E-19R1 - Added trench drain edge angle per RFI 231-Z', 4282.00::numeric, 209),
  ('CO-3', 'PIW E-16R - Revised bollard base plate design', 472.00::numeric, 210),
  ('CO-4', 'PIW E-15R2 - Fabrication and installation of two roof ladders at BBGR CNG Yard', 7026.00::numeric, 211),
  ('CO-4', 'PIW E-7R2 - Fabrication and installation of two roof ladders at BBGR Area 6', 7192.00::numeric, 212),
  ('CO-4', 'PIW E-26 - Replacement of lost chassis pit embed angle', 2353.00::numeric, 213),
  ('CO-5', 'PIW E-6R3 - New grating for MRL penthouse elevator working platform', 25450.00::numeric, 214),
  ('CO-5', 'PIW E-25R T&M - Field drilling and C-channel installation', 14677.00::numeric, 215),
  ('CO-6', 'PIW E-11R3 - Backcharge for WMATA burn permit delays', 1474.00::numeric, 216),
  ('CO-6', 'PIW E-12R1 - Revised edge angle per RFI 177-Z', 4230.00::numeric, 217),
  ('CO-6', 'PIW E-30 T&M - Repair damaged hose reel support steel', 717.00::numeric, 218),
  ('CO-7', 'PIW E-23R3 - New top-of-wall clips', 19228.00::numeric, 219),
  ('CO-8', 'PIW E-24R5 - Rain harvest tank ladders and backcharge', 28489.00::numeric, 220),
  ('CO-9', 'PIW E-32R1/E-35R/E-38R/E-40 T&M - Extra work for CSF', 21192.00::numeric, 221),
  ('CO-10', 'PIW E-17R3, PIW E-33 and CSF T&M', 4711.00::numeric, 222),
  ('CO-11', 'PIW E-44 - Cut and move decking and unit support for Area 1 paint booth AMU', 2021.00::numeric, 223),
  ('CO-12', 'PIW E-28 - Pedestrian bridge railing modification per RFI 749-Z.1', 32041.00::numeric, 224),
  ('CO-13', 'PIW E-43R T&M - Stair clips in Stair Tower 1', 2380.00::numeric, 225),
  ('CO-13', 'PIW E-46R T&M - Repair damaged grating in Area 5 water reclaim room', 1169.00::numeric, 226),
  ('CO-13', 'PIW E-48 - Cast-in-place corner guards at parking garage ramp columns', 1962.00::numeric, 227),
  ('CO-14', 'PIW E-45 - Six additional bollards per RFI 848-Z and RFI 789-Z', 6412.00::numeric, 228),
  ('CO-15', 'PIW E-45B - Guard booth and fuel bay bollards', 4134.00::numeric, 229),
  ('CO-15', 'PIW E-36R - New parapet guardrail and handrail per DCN 12', 18764.00::numeric, 230),
  ('CO-15', 'PIW E-55R - CNG ladder modification per RFI 860-Z', 1171.00::numeric, 231),
  ('CO-16', 'PIW E-57 - Water fountain ADA grating modification', 8975.00::numeric, 232),
  ('CO-17', 'Settlement for PIW E-51R2 and PIW E-52R2', 56660.00::numeric, 233),
  ('CO-17', 'Deductive bond adjustment for executed subcontract', -50000.00::numeric, 234),
  ('CO-18', 'PIW E-31R - Delete headache bar', -16474.00::numeric, 235),
  ('CO-18', 'PIW E-56 - 10LD1 patio roof ladder credit', -906.00::numeric, 236),
  ('CO-19', 'PIWC E-60R - Column protection plates removed in redesign', -27000.00::numeric, 237),
  ('CO-19', 'PIWC E-60R - Snow gates removed in redesign', -5000.00::numeric, 238),
  ('CO-19', 'PIWC E-60R - Parking garage stair railings removed in redesign', -17000.00::numeric, 239),
  ('CO-19', 'PIWC E-60R - Divider beams added in redesign', 42000.00::numeric, 240),
  ('CO-19', 'PIWC E-60R - Cane rail added in redesign', 8500.00::numeric, 241),
  ('CO-19', 'PIWC E-60R - Steel roof ladder and Ladder-Up extension added', 30750.00::numeric, 242),
  ('CO-19', 'PIWC E-60R - Miscellaneous roof framing, CMU support steel and deck added', 45025.00::numeric, 243)
) as item(co_number, description, amount, sort_order)
where bid.project_name = 'WMATA Bladensburg Bid Package #5'
and not exists (
  select 1 from public.bid_work_items existing
  where existing.bid_opportunity_id = bid.id
    and existing.change_order_number = item.co_number
    and existing.description = item.description
);
