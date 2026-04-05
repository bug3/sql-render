SELECT
  event_id,
  event_name
FROM
  {{tableName}}
WHERE
  status = '{{status}}'
  AND created_at >= '{{startDate}}'
ORDER BY
  {{orderBy}}
LIMIT
  {{limit}}
