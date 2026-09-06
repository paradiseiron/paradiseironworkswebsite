insert into public.bid_opportunities (
  project_name, general_contractor, owner_name, bid_due_date, status,
  estimated_contract_value, probability, priority, scope_summary, exclusion_notes,
  notes, created_by, created_at, updated_at, submitted_at, outcome_at,
  proposal_number, proposal_date, proposal_recipient_company,
  proposal_recipient_address, proposal_attention, proposal_intro,
  proposal_scope_sections, proposal_pricing_mode, proposal_lump_sum_amount,
  proposal_clarifications, proposal_exclusions, proposal_addenda,
  proposal_prepared_by, proposal_prepared_by_title, proposal_drafted_at
)
select
  'NIH Robotics Shop Renovation (C200927)', 'JB Contracting, Inc.',
  'National Institutes of Health', date '2026-03-26', 'won',
  39800, 100, 'normal',
  'Folding glass partition support steel, hose reel support steel, delegated anchor design, fabrication, finishing, installation, and submittals.',
  'Concrete scanning, snorkel relocation support, structural redesign beyond delegated anchor design, and field-applied finish coats are excluded or by others.',
  'Historical winning proposal imported from the revised proposal dated March 26, 2026.',
  admin.user_id, timestamptz '2026-03-26 12:00:00-04', now(),
  timestamptz '2026-03-26 12:00:00-04', timestamptz '2026-03-26 12:00:00-04',
  'C200927', date '2026-03-26', 'JB Contracting, Inc.',
  E'10744 Baltimore Avenue\nBeltsville, MD 20705', 'Eric Bonilla',
  'Based on clarifications, please see our revised proposal and scope for the NIH Robotics Shop Renovation (C200927), including the Folding Glass Partition Steel Supports, Hose Reel Steel Supports, and delegated design scope.',
  jsonb_build_array(
    jsonb_build_object('title','Folding Glass Partition Support Steel','content',E'• Furnish and install L6×4×5/16 header angle\n• Furnish and install L4×4×1/4 intermediate angles at 48" o.c. max\n• Furnish and install bracing angles and anchorage as detailed\n• Install KB-TZ2 torque-controlled anchors into structure above'),
    jsonb_build_object('title','Hose Reel Support Steel (2 Locations)','content',E'• Furnish and install HSS 3×3×1/4 vertical supports\n• Furnish and install (2) 8"×11"×1/2" mounting plates\n• Furnish and install (2) 8"×8"×1/2" anchor plates at slab underside\n• Install required KB-TZ2 anchors'),
    jsonb_build_object('title','Added Scope per RFI Responses','content',E'1. Delegated Design – Anchors\nProvide engineering for anchor selection, embedment, edge-distance verification, and stamped calculations.\n\n2. Partition Supplier Steel (Furnish-Only)\nSteel components shown on the partition manufacturer’s drawings as “BY OTHERS” shall be furnished by PIWC only. Installation, alignment, and operational performance remain the responsibility of the partition manufacturer/installer.'),
    jsonb_build_object('title','Fabrication, Finishing & Installation','content',E'• Shop fabrication of all steel components\n• Shop primer; all field-applied finish coats and topcoats are by others\n• Field installation includes cutting, drilling, fasteners, and alignment'),
    jsonb_build_object('title','Submittals','content',E'• Complete shop drawings for all steel assemblies\n• Delegated design calculations for anchors')
  ),
  'lump_sum', 39800,
  E'PIWC delegated design verifies anchor and plate capacity and the ASTM E557 allowable deflection limit. Partition layout, load data, system tolerances, global slab behavior, floor flatness, and overall structural deflection remain by others. Anchor locations are based on the supplier’s final layout. Field-condition or engineer-directed redesign is a change order. Work assumes standard NIH access and hours; escort, security, or staging delays outside PIWC control are change-order eligible.',
  E'Concrete scanning by others. No snorkel relocation support unless added by change order. No structural redesign beyond delegated anchor design. Field-applied finish coats and topcoats by others.',
  null, 'George Clay', 'Project Manager', timestamptz '2026-03-26 12:00:00-04'
from public.user_roles admin
where admin.role = 'admin'
  and not exists (select 1 from public.bid_opportunities where project_name = 'NIH Robotics Shop Renovation (C200927)')
limit 1;

insert into public.bid_opportunities (
  project_name, general_contractor, owner_name, project_address, city, state,
  zip_code, bid_due_date, status, estimated_contract_value, probability,
  priority, scope_summary, notes, created_by, created_at, updated_at,
  submitted_at, outcome_at, proposal_number, proposal_date,
  proposal_recipient_company, proposal_recipient_address, proposal_attention,
  proposal_intro, proposal_scope_sections, proposal_pricing_mode,
  proposal_pricing_items, proposal_clarifications, proposal_terms,
  proposal_prepared_by, proposal_prepared_by_title, proposal_drafted_at
)
select
  'Purple Line Light Rail P3 Project', 'Maryland Transit Solutions MTS',
  'Maryland Department of Transportation', '5700 Rivertech Court',
  'Riverdale', 'MD', '20737', date '2025-10-03', 'won', 340948.77,
  100, 'normal',
  'Handrail with stainless steel cable net infill and rub rail handrail.',
  'Historical winning proposal imported from PLDB-SUB-372 dated October 3, 2025.',
  admin.user_id, timestamptz '2025-10-03 12:00:00-04', now(),
  timestamptz '2025-10-03 12:00:00-04', timestamptz '2025-10-03 12:00:00-04',
  'PLDB-SUB-372', date '2025-10-03', 'Maryland Transit Solutions MTS',
  E'Purple Line Project\n5700 Rivertech Court\nRiverdale, MD 20737',
  'Gabriel Menedez – Pidal, Contracts Manager; Scott Glass, Area Manager',
  'As requested, please accept our proposal prices for the referenced scope of work described below. The unit pricing represents correspondence between Scott Glass and Ron Brown and is incorporated into the expected subcontract.',
  jsonb_build_array(jsonb_build_object(
    'title', 'Scope of Work',
    'content', E'• Handrail with stainless steel cable net infill\n• Rub rail handrail'
  )),
  'line_items',
  jsonb_build_array(
    jsonb_build_object('description','Handrail w/ Stainless Steel Cable Net Infill','quantity',417,'unit','LF','unitPrice',695.12,'amount',289865.85),
    jsonb_build_object('description','Rub Rail Handrail','quantity',116,'unit','LF','unitPrice',440.37,'amount',51082.92)
  ),
  'All pricing must meet manufacturer and supplier requirements.',
  'This proposal price is valid for 30 days. All pricing is subject to change after 30 days.',
  'Ronald Brown', 'President', timestamptz '2025-10-03 12:00:00-04'
from public.user_roles admin
where admin.role = 'admin'
  and not exists (select 1 from public.bid_opportunities where proposal_number = 'PLDB-SUB-372')
limit 1;

insert into public.bid_opportunities (
  project_name, general_contractor, owner_name, bid_due_date, status,
  estimated_contract_value, probability, priority, scope_summary, exclusion_notes,
  notes, created_by, created_at, updated_at, submitted_at, outcome_at,
  proposal_date, proposal_recipient_company, proposal_attention, proposal_intro,
  proposal_scope_sections, proposal_pricing_mode, proposal_lump_sum_amount,
  proposal_clarifications, proposal_exclusions, proposal_addenda,
  proposal_prepared_by, proposal_prepared_by_title, proposal_drafted_at
)
select
  'WMATA Bladensburg Bid Package #5', 'Hensel Phelps',
  'Washington Metropolitan Area Transit Authority', date '2022-02-22', 'won',
  1966859, 100, 'normal',
  'Work defined by the Hensel Phelps 0100-Bid Form and issued drawings for WMATA Bladensburg Bid Package #5.',
  'Bid form exclusions on lines 38, 40, and 48; all trench drains at overhead doors removed.',
  'Historical winning revised bid imported from the February 22, 2022 submission.',
  admin.user_id, timestamptz '2022-02-22 12:00:00-05', now(),
  timestamptz '2022-02-22 12:00:00-05', timestamptz '2022-02-22 12:00:00-05',
  date '2022-02-22', 'Hensel Phelps', 'Jarett Lowman',
  'Thank you for the opportunity to bid the above-mentioned project. Our price is based on the Hensel Phelps 0100-Bid Form and drawings provided.',
  jsonb_build_array(jsonb_build_object('title','Scope of Work','content','Provide the work described in the Hensel Phelps 0100-Bid Form and issued drawings for WMATA Bladensburg Bid Package #5.')),
  'lump_sum', 1966859,
  'The exclusions of the bid form, lines 38, 40, and 48, have been taken into consideration. All trench drains at overhead doors have been removed.',
  'Bid form exclusions on lines 38, 40, and 48. All trench drains at overhead doors are removed.',
  'Addenda 1–4 acknowledged.', 'Ronald A. Brown', 'President',
  timestamptz '2022-02-22 12:00:00-05'
from public.user_roles admin
where admin.role = 'admin'
  and not exists (select 1 from public.bid_opportunities where project_name = 'WMATA Bladensburg Bid Package #5')
limit 1;
