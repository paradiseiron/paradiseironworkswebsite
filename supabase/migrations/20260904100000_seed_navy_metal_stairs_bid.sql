insert into public.bid_opportunities (
  project_name,
  general_contractor,
  owner_name,
  project_address,
  city,
  state,
  zip_code,
  contact_name,
  contact_email,
  bid_due_date,
  bid_due_time,
  status,
  estimated_contract_value,
  probability,
  priority,
  scope_summary,
  exclusion_notes,
  notes,
  created_by,
  created_at,
  updated_at,
  submitted_at,
  proposal_number,
  proposal_date,
  proposal_recipient_company,
  proposal_attention,
  proposal_intro,
  proposal_scope_sections,
  proposal_pricing_mode,
  proposal_lump_sum_amount,
  proposal_clarifications,
  proposal_exclusions,
  proposal_addenda,
  proposal_terms,
  proposal_prepared_by,
  proposal_prepared_by_title,
  proposal_drafted_at
)
select
  'Metal Stair Fabrication and Installation – NRL Building A59',
  null,
  'Department of the Navy – U.S. Naval Research Laboratory',
  '4555 Overlook Ave SW',
  'Washington',
  'DC',
  '20375',
  'Billy Castleberry',
  'billy.w.castleberry.civ@us.navy.mil',
  date '2026-09-15',
  time '13:00',
  'submitted',
  45000.00,
  null,
  'normal',
  'Design, fabricate, finish, deliver, and install a new code-compliant steel stair system from Mechanical Room 19L to the penthouse in NRL Building A59, including engineering, submittals, rails, grating, painting, installation, and closeout.',
  'Demolition; asbestos or lead testing and remediation; electrical, mechanical, or HVAC work; crane lift-plan engineering; utility shutdown management; traffic-control plans; soil boring or geotechnical testing; badging fees; photography; work outside the defined stair system; and requirements in documents not furnished to PIWC at the time of quoting.',
  'Historical submitted proposal imported from the September 4, 2026 Paradise Ironworks proposal. Solicitation N0017326Q1903; NAICS 238120. Solicitation contact information and the amended September 15, 2026 1:00 PM offer deadline were added from the published solicitation record.',
  admin.user_id,
  timestamptz '2026-09-04 12:00:00-04',
  now(),
  timestamptz '2026-09-04 12:00:00-04',
  'N0017326Q1903',
  date '2026-09-04',
  'Prime Contractor Bidders (Small Business Set-Aside)',
  'Estimator',
  'Please see our proposal and scope of work for the Metal Stairs Fabrication and Installation project at Building A59, Mechanical Room 19L to Penthouse. Paradise Ironworks & Construction LLC proposes to furnish all labor, materials, equipment, and services necessary to design, fabricate, finish, and install the new code-compliant steel stair system.',
  jsonb_build_array(
    jsonb_build_object(
      'title', 'Design & Engineering',
      'content', E'• Shop drawings\n• Foundation and anchoring details\n• Miscellaneous accessories drawings\n• Preliminary design submittals to the NRL EIC before fabrication'
    ),
    jsonb_build_object(
      'title', 'Fabrication',
      'content', E'• Steel stringers\n• Intermediate landing\n• Steel treads\n• Guardrails and handrails\n• Shop-applied DTM primer and finish paint, two coats, blue per Amendment 0002\n• Grip Strut safety grating or approved equivalent per Amendment 0002'
    ),
    jsonb_build_object(
      'title', 'Installation',
      'content', E'• Delivery to NRL\n• Rigging and placement\n• Field welding and bolting\n• Guardrail and handrail installation\n• Touch-up painting\n• Coordination with the NRL EIC for access, escorts, and working-hour limitations'
    ),
    jsonb_build_object(
      'title', 'Closeout',
      'content', E'• O&M data per UFGS 01 78 23\n• Closeout submittals per UFGS 01 78 00\n• Warranty documentation\n• Final walkthrough and punch-list completion'
    )
  ),
  'lump_sum',
  45000.00,
  E'This quote is based solely on the documents provided with the RFQ email: N0017326Q1903 Attachment 1 – A59 Metal Stairs SOW; Attachment 2 – Layout and Images; and SF30 Amendments 0001 and 0002. The price includes design, fabrication, finish painting, installation, shipping, and closeout documentation and is Firm-Fixed-Price.',
  E'Any specifications, drawings, UFGS sections, UFC criteria, or other documents not furnished to PIWC at the time of quoting; asbestos or lead testing or remediation; demolition; electrical, mechanical, or HVAC work; crane lift-plan engineering; utility shutdown management; traffic-control plans; soil boring or geotechnical testing; badging fees; work outside the defined stair system; and photography, which is prohibited by the SOW.',
  'SF30 Amendments 0001 and 0002 acknowledged.',
  E'Payment: Net 30 days.\nValidity: Quote valid through the solicitation due date.\nPreliminary schedule: Design submittal within 3 weeks of prime contractor award; fabrication 4–6 weeks after design approval; installation 3–5 days onsite; closeout within 15 days of completion. Final durations are subject to award timing, NRL access coordination, and Government review periods. PIWC will comply with applicable UFC, UFGS, OSHA 29 CFR 1926, EM 385-1-1, NFPA, ANSI, and ASTM requirements provided to PIWC.',
  'George Clay',
  'Project Manager',
  timestamptz '2026-09-04 12:00:00-04'
from public.user_roles admin
where admin.role = 'admin'
  and not exists (
    select 1
    from public.bid_opportunities existing
    where existing.proposal_number = 'N0017326Q1903'
       or existing.project_name = 'Metal Stair Fabrication and Installation – NRL Building A59'
  )
limit 1;
