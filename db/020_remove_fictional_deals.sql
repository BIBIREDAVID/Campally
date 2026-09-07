-- Union — remove the fictional local-merchant demo deals now that real,
-- verifiable student deals exist (see 019_real_student_deals.sql).
-- deal_favourites cascades on delete, so any saves are cleaned up too.
-- Run after 019_real_student_deals.sql.

delete from deals
where merchant_name in (
  'Mama Put Kitchen', 'QuickPrint Hub', 'Campus Bites Delivery',
  'FitZone Gym', 'BookNest', 'Naija Data Plug', 'Threads & Co'
);
