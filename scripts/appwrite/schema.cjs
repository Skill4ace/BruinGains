const DATABASE_ID = 'bruingains_campus';
const CACHE_BUCKET_ID = 'campus-cache';

const CACHE_FILES = {
  manifest: 'campus-manifest-json',
  summary: 'campus-summary-json',
  full: 'campus-full-json',
  diningLatest: 'dining-latest-json',
  gymsCurrent: 'gyms-current-json',
  nutritionQueue: 'dining-nutrition-queue-json',
};

const TABLES = [
  {
    id: 'dining_halls',
    name: 'Dining Halls',
    columns: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'short_name', type: 'string', size: 255 },
      { key: 'sort_order', type: 'integer', required: true },
      { key: 'is_main_hall', type: 'boolean', required: true },
      { key: 'fit_percent', type: 'integer', min: 0, max: 100 },
      { key: 'breakfast_hours', type: 'string', size: 255 },
      { key: 'lunch_hours', type: 'string', size: 255 },
      { key: 'dinner_hours', type: 'string', size: 255 },
      { key: 'late_night_hours', type: 'string', size: 255 },
      { key: 'image_key', type: 'string', size: 255 },
      { key: 'is_active', type: 'boolean', required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'updated_at', type: 'datetime', required: true },
      { key: 'source_path', type: 'string', size: 1024 },
    ],
    indexes: [
      { key: 'dining_halls_name_key', type: 'unique', columns: ['name'] },
      { key: 'dining_halls_sort_order_idx', type: 'key', columns: ['sort_order'] },
    ],
  },
  {
    id: 'gym_locations',
    name: 'Gym Locations',
    columns: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'hours', type: 'string', size: 255, required: true },
      { key: 'sort_order', type: 'integer', required: true },
      { key: 'is_active', type: 'boolean', required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'updated_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'gym_locations_name_key', type: 'unique', columns: ['name'] },
      { key: 'gym_locations_sort_order_idx', type: 'key', columns: ['sort_order'] },
    ],
  },
  {
    id: 'gym_capacity_snapshots',
    name: 'Gym Capacity Snapshots',
    columns: [
      { key: 'location_id', type: 'string', size: 255, required: true },
      { key: 'load', type: 'float', required: true, min: 0, max: 1 },
      { key: 'percent_full', type: 'integer', min: 0, max: 100 },
      { key: 'captured_at', type: 'datetime', required: true },
      { key: 'source', type: 'string', size: 255 },
      { key: 'zone_name', type: 'string', size: 255 },
      { key: 'is_closed', type: 'boolean', required: true },
      { key: 'zone_breakdown', type: 'longtext' },
    ],
    indexes: [
      {
        key: 'gym_capacity_location_captured_idx',
        type: 'key',
        columns: ['location_id', 'captured_at'],
        orders: ['asc', 'desc'],
      },
      {
        key: 'gym_capacity_location_captured_key',
        type: 'unique',
        columns: ['location_id', 'captured_at'],
      },
    ],
  },
  {
    id: 'menu_snapshots',
    name: 'Menu Snapshots',
    columns: [
      { key: 'hall_id', type: 'string', size: 255, required: true },
      { key: 'service_date', type: 'string', size: 32, required: true },
      {
        key: 'meal_period',
        type: 'enum',
        elements: ['breakfast', 'lunch', 'dinner', 'lateNight'],
        required: true,
      },
      { key: 'source_url', type: 'string', size: 2048 },
      { key: 'fetched_at', type: 'datetime', required: true },
      {
        key: 'status',
        type: 'enum',
        elements: ['ready', 'stale', 'failed', 'processing'],
        required: true,
      },
    ],
    indexes: [
      {
        key: 'menu_snapshots_hall_date_meal_key',
        type: 'unique',
        columns: ['hall_id', 'service_date', 'meal_period'],
      },
      {
        key: 'menu_snapshots_service_date_idx',
        type: 'key',
        columns: ['service_date', 'meal_period'],
        orders: ['desc', 'asc'],
      },
    ],
  },
  {
    id: 'menu_items',
    name: 'Menu Items',
    columns: [
      { key: 'snapshot_id', type: 'string', size: 36, required: true },
      { key: 'station_name', type: 'string', size: 255 },
      { key: 'item_name', type: 'string', size: 1024, required: true },
      { key: 'serving_size', type: 'string', size: 255 },
      { key: 'calories', type: 'integer', min: 0 },
      { key: 'protein_g', type: 'integer', min: 0 },
      { key: 'carbs_g', type: 'integer', min: 0 },
      { key: 'fats_g', type: 'integer', min: 0 },
      { key: 'item_order', type: 'integer', required: true },
      { key: 'recipe_id', type: 'integer' },
      { key: 'badge_labels', type: 'longtext' },
      { key: 'allergen_labels', type: 'longtext' },
      { key: 'ingredients', type: 'longtext' },
      { key: 'nutrition_facts', type: 'longtext' },
      { key: 'customization_options', type: 'longtext' },
      {
        key: 'nutrition_status',
        type: 'enum',
        elements: ['pending', 'ready', 'unavailable', 'failed'],
      },
      { key: 'nutrition_fetched_at', type: 'datetime' },
      { key: 'nutrition_error', type: 'longtext' },
    ],
    indexes: [
      {
        key: 'menu_items_snapshot_order_idx',
        type: 'key',
        columns: ['snapshot_id', 'item_order'],
      },
      {
        key: 'menu_items_snapshot_recipe_idx',
        type: 'key',
        columns: ['snapshot_id', 'recipe_id'],
      },
    ],
  },
  {
    id: 'dining_ingestion_runs',
    name: 'Dining Ingestion Runs',
    columns: [
      { key: 'target_date', type: 'string', size: 32, required: true },
      { key: 'trigger_source', type: 'string', size: 255, required: true },
      { key: 'requested_at', type: 'datetime', required: true },
      { key: 'started_at', type: 'datetime', required: true },
      { key: 'completed_at', type: 'datetime' },
      {
        key: 'status',
        type: 'enum',
        elements: ['running', 'success', 'partial_failure', 'failure'],
        required: true,
      },
      { key: 'hall_count', type: 'integer', required: true, min: 0 },
      { key: 'snapshot_count', type: 'integer', required: true, min: 0 },
      { key: 'item_count', type: 'integer', required: true, min: 0 },
      { key: 'error_count', type: 'integer', required: true, min: 0 },
      { key: 'notes', type: 'longtext' },
      { key: 'error_message', type: 'longtext' },
    ],
    indexes: [
      {
        key: 'dining_ingestion_target_date_idx',
        type: 'key',
        columns: ['target_date', 'started_at'],
        orders: ['desc', 'desc'],
      },
    ],
  },
  {
    id: 'campus_data_request_log',
    name: 'Campus Data Request Log',
    columns: [
      { key: 'user_id', type: 'string', size: 255, required: true },
      { key: 'ip_address', type: 'ip' },
      { key: 'requested_at', type: 'datetime', required: true },
    ],
    indexes: [
      {
        key: 'campus_data_request_user_idx',
        type: 'key',
        columns: ['user_id', 'requested_at'],
        orders: ['asc', 'desc'],
      },
      {
        key: 'campus_data_request_ip_idx',
        type: 'key',
        columns: ['ip_address', 'requested_at'],
        orders: ['asc', 'desc'],
      },
    ],
  },
];

const FUNCTION_DEFINITIONS = [
  {
    id: 'campus-data',
    name: 'Campus Data',
    execute: ['users'],
    schedule: '',
    timeout: 30,
    scopes: ['buckets.read', 'files.read'],
  },
  {
    id: 'campus-cache-build',
    name: 'Campus Cache Build',
    execute: [],
    schedule: '',
    timeout: 120,
    scopes: ['rows.read', 'buckets.read', 'buckets.write', 'files.read', 'files.write'],
  },
  {
    id: 'campus-activity-sync',
    name: 'Campus Activity Sync',
    execute: [],
    schedule: '*/5 * * * *',
    timeout: 120,
    scopes: ['rows.write', 'buckets.read', 'buckets.write', 'files.read', 'files.write'],
  },
  {
    id: 'dining-ingest',
    name: 'Dining Ingest',
    execute: [],
    schedule: '0 0,4,11,18 * * *',
    timeout: 300,
    scopes: ['rows.write', 'buckets.read', 'buckets.write', 'files.read', 'files.write'],
  },
  {
    id: 'dining-nutrition-backfill',
    name: 'Dining Nutrition Backfill',
    execute: [],
    schedule: '*/5 * * * *',
    timeout: 300,
    scopes: ['rows.write', 'buckets.read', 'buckets.write', 'files.read', 'files.write'],
  },
];

module.exports = {
  CACHE_BUCKET_ID,
  CACHE_FILES,
  DATABASE_ID,
  FUNCTION_DEFINITIONS,
  TABLES,
};
