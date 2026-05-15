const { Client, TablesDB } = require('node-appwrite');

const { getAppwriteConfig } = require('./appwrite-env.cjs');
const { DATABASE_ID } = require('./schema.cjs');

const DINING_HALLS = [
  {
    $id: 'bruin-plate',
    name: 'Bruin Plate',
    short_name: 'Bruin Plate',
    sort_order: 1,
    is_main_hall: true,
    fit_percent: 94,
    breakfast_hours: '7:00 AM - 9:00 AM',
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'bruin-plate',
    source_path: '/bruin-plate',
  },
  {
    $id: 'de-neve',
    name: 'De Neve',
    short_name: 'De Neve',
    sort_order: 2,
    is_main_hall: true,
    fit_percent: 88,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '10:00 PM - 12:00 AM',
    image_key: 'de-neve',
    source_path: '/de-neve-dining',
  },
  {
    $id: 'epicuria-covel',
    name: 'Epicuria at Covel',
    short_name: 'Epicuria',
    sort_order: 3,
    is_main_hall: true,
    fit_percent: 92,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'epicuria-covel',
    source_path: '/epicuria-at-covel',
  },
  {
    $id: 'feast-rieber',
    name: 'Feast at Rieber',
    short_name: 'Feast',
    sort_order: 4,
    is_main_hall: false,
    fit_percent: 90,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '9:00 PM - 11:00 PM',
    image_key: 'feast-rieber',
    source_path: '/spice-kitchen',
  },
  {
    $id: 'bruin-cafe',
    name: 'Bruin Cafe',
    short_name: 'Bruin Cafe',
    sort_order: 5,
    is_main_hall: false,
    fit_percent: 81,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'bruin-cafe',
    source_path: '/bruin-cafe',
  },
  {
    $id: 'cafe-1919',
    name: 'Cafe 1919',
    short_name: '1919',
    sort_order: 6,
    is_main_hall: false,
    fit_percent: 76,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'cafe-1919',
    source_path: '/cafe-1919',
  },
  {
    $id: 'study-hedrick',
    name: 'The Study',
    short_name: 'The Study',
    sort_order: 7,
    is_main_hall: false,
    fit_percent: 84,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '9:00 PM - 12:00 AM',
    image_key: 'study-hedrick',
    source_path: '/the-study-at-hedrick',
  },
  {
    $id: 'the-drey',
    name: 'The Drey',
    short_name: 'The Drey',
    sort_order: 8,
    is_main_hall: false,
    fit_percent: 79,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'the-drey',
    source_path: '/the-drey',
  },
  {
    $id: 'rendezvous',
    name: 'Rendezvous',
    short_name: 'Rende',
    sort_order: 9,
    is_main_hall: false,
    fit_percent: 86,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'rendezvous',
    source_path: '/rendezvous',
  },
  {
    $id: 'bruin-bowl',
    name: 'Bruin Bowl',
    short_name: 'Bruin Bowl',
    sort_order: 10,
    is_main_hall: false,
    fit_percent: 91,
    breakfast_hours: null,
    lunch_hours: null,
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'bruin-bowl',
    source_path: '/bruin-bowl',
  },
  {
    $id: 'epicuria-ackerman',
    name: 'Epicuria at Ackerman',
    short_name: 'Epic Ackerman',
    sort_order: 11,
    is_main_hall: false,
    fit_percent: 83,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    image_key: 'epicuria-ackerman',
    source_path: '/epicuria-at-ackerman',
  },
];

const GYM_LOCATIONS = [
  {
    $id: 'wooden',
    name: 'Wooden Center',
    hours: '5:15 AM - 1:00 AM',
    sort_order: 1,
  },
  {
    $id: 'bfit',
    name: 'BFit Gym',
    hours: '6:00 AM - 12:00 AM',
    sort_order: 2,
  },
];

function createTables() {
  const { endpoint, projectId, apiKey } = getAppwriteConfig();
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new TablesDB(client);
}

function withTimestamps(row, timestamp) {
  return {
    ...row,
    created_at: timestamp,
    updated_at: timestamp,
    is_active: true,
  };
}

async function upsertRows(tables, tableId, rows) {
  await tables.upsertRows({
    databaseId: DATABASE_ID,
    tableId,
    rows,
  });
}

async function main() {
  const tables = createTables();
  const timestamp = new Date().toISOString();

  await upsertRows(
    tables,
    'dining_halls',
    DINING_HALLS.map((row) => withTimestamps(row, timestamp)),
  );
  await upsertRows(
    tables,
    'gym_locations',
    GYM_LOCATIONS.map((row) => withTimestamps(row, timestamp)),
  );

  console.log(
    JSON.stringify(
      {
        diningHalls: DINING_HALLS.length,
        gymLocations: GYM_LOCATIONS.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
