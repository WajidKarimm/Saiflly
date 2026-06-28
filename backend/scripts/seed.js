/**
 * Database Seeding Script
 * Populates the NestSafely database with sample data for development/testing
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nestsafely',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    await client.query('BEGIN');

    // 1. Seed Users
    console.log('📝 Seeding users...');
    const usersData = [
      {
        id: 'user-1',
        email: 'john.doe@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jbMYUe', // hashed 'password'
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+92-300-1234567',
        role: 'user',
      },
      {
        id: 'user-2',
        email: 'jane.smith@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jbMYUe',
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+92-300-9876543',
        role: 'user',
      },
      {
        id: 'admin-1',
        email: 'admin@nestsafely.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jbMYUe',
        first_name: 'Admin',
        last_name: 'User',
        phone_number: '+92-300-5555555',
        role: 'admin',
      },
    ];

    for (const user of usersData) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.password, user.first_name, user.last_name, user.phone_number, user.role]
      );
    }
    console.log('✅ Users seeded');

    // 2. Seed Properties
    console.log('📝 Seeding properties...');
    const propertiesData = [
      {
        id: 'prop-1',
        title: 'Luxury Apartment in DHA',
        address: 'Plot 123, Phase VI, DHA, Lahore',
        city: 'Lahore',
        area: 'DHA',
        type: 'rent',
        category: 'apartment',
        latitude: 31.5497,
        longitude: 74.3436,
        bedrooms: 3,
        bathrooms: 2,
        area_sqft: 2500,
        constructed_year: 2020,
        price: 150000,
        currency: 'PKR',
        owner_id: 'user-1',
      },
      {
        id: 'prop-2',
        title: 'Beautiful House in Defence',
        address: 'Street 23, Defence, Lahore',
        city: 'Lahore',
        area: 'Defence',
        type: 'sale',
        category: 'house',
        latitude: 31.5467,
        longitude: 74.3706,
        bedrooms: 4,
        bathrooms: 3,
        area_sqft: 3500,
        constructed_year: 2018,
        price: 25000000,
        currency: 'PKR',
        owner_id: 'user-2',
      },
      {
        id: 'prop-3',
        title: 'Cozy Apartment in Gulberg',
        address: 'Apartment 5B, Gulberg III, Lahore',
        city: 'Lahore',
        area: 'Gulberg',
        type: 'rent',
        category: 'apartment',
        latitude: 31.5271,
        longitude: 74.3592,
        bedrooms: 2,
        bathrooms: 1,
        area_sqft: 1800,
        constructed_year: 2019,
        price: 80000,
        currency: 'PKR',
        owner_id: 'user-1',
      },
      {
        id: 'prop-4',
        title: 'Commercial Space in Mall Road',
        address: 'Shop No. 45, Mall Road, Lahore',
        city: 'Lahore',
        area: 'Mall Road',
        type: 'rent',
        category: 'commercial',
        latitude: 31.5497,
        longitude: 74.3284,
        area_sqft: 1200,
        constructed_year: 2021,
        price: 200000,
        currency: 'PKR',
        owner_id: 'user-2',
      },
      {
        id: 'prop-5',
        title: 'Modern Townhouse in Bahria',
        address: 'Sector F, Bahria Town, Lahore',
        city: 'Lahore',
        area: 'Bahria',
        type: 'sale',
        category: 'townhouse',
        latitude: 31.8119,
        longitude: 74.3284,
        bedrooms: 3,
        bathrooms: 2,
        area_sqft: 2200,
        constructed_year: 2022,
        price: 18000000,
        currency: 'PKR',
        owner_id: 'user-1',
      },
    ];

    for (const prop of propertiesData) {
      const point = `SRID=4326;POINT(${prop.longitude} ${prop.latitude})`;
      await client.query(
        `INSERT INTO properties 
         (id, title, address, city, area, type, category, location, latitude, longitude, bedrooms, bathrooms, area_sqft, constructed_year, price, currency, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO NOTHING`,
        [
          prop.id, prop.title, prop.address, prop.city, prop.area, prop.type, prop.category,
          point, prop.latitude, prop.longitude, prop.bedrooms, prop.bathrooms, prop.area_sqft,
          prop.constructed_year, prop.price, prop.currency, prop.owner_id
        ]
      );
    }
    console.log('✅ Properties seeded');

    // 3. Seed Safety Scores
    console.log('📝 Seeding safety scores...');
    const safetyScores = [
      { property_id: 'prop-1', area_score: 75, history_score: 85, facility_score: 90, cost_score: 70, overall_score: 80, grade: 'B' },
      { property_id: 'prop-2', area_score: 82, history_score: 88, facility_score: 92, cost_score: 75, overall_score: 84, grade: 'A' },
      { property_id: 'prop-3', area_score: 68, history_score: 72, facility_score: 80, cost_score: 65, overall_score: 71, grade: 'B' },
      { property_id: 'prop-4', area_score: 55, history_score: 60, facility_score: 65, cost_score: 50, overall_score: 58, grade: 'C' },
      { property_id: 'prop-5', area_score: 78, history_score: 85, facility_score: 88, cost_score: 72, overall_score: 81, grade: 'A' },
    ];

    for (const score of safetyScores) {
      const overallScore = Math.round(
        score.area_score * 0.25 +
        score.history_score * 0.15 +
        score.facility_score * 0.2 +
        score.cost_score * 0.05 +
        score.area_score * 0.35
      );
      
      await client.query(
        `INSERT INTO safety_scores 
         (property_id, area_score, history_score, facility_score, cost_score, overall_score, grade, verdict)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (property_id) DO UPDATE SET
           area_score = $2, history_score = $3, facility_score = $4, 
           cost_score = $5, overall_score = $6, grade = $7`,
        [score.property_id, score.area_score, score.history_score, score.facility_score, score.cost_score, overallScore, score.grade, 'RENT']
      );
    }
    console.log('✅ Safety scores seeded');

    // 4. Seed Area Data
    console.log('📝 Seeding area data...');
    const areaData = [
      {
        location: `SRID=4326;POINT(74.3436 31.5497)`,
        city: 'Lahore',
        area_name: 'DHA',
        crime_index: 25,
        flood_zone: 'low',
        noise_level_db: 65,
        air_quality_index: 75,
      },
      {
        location: `SRID=4326;POINT(74.3706 31.5467)`,
        city: 'Lahore',
        area_name: 'Defence',
        crime_index: 20,
        flood_zone: 'low',
        noise_level_db: 60,
        air_quality_index: 80,
      },
      {
        location: `SRID=4326;POINT(74.3592 31.5271)`,
        city: 'Lahore',
        area_name: 'Gulberg',
        crime_index: 35,
        flood_zone: 'medium',
        noise_level_db: 70,
        air_quality_index: 70,
      },
    ];

    for (const area of areaData) {
      await client.query(
        `INSERT INTO area_data 
         (location, city, area_name, crime_index, flood_zone, noise_level_db, air_quality_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [area.location, area.city, area.area_name, area.crime_index, area.flood_zone, area.noise_level_db, area.air_quality_index]
      );
    }
    console.log('✅ Area data seeded');

    // 5. Seed Facilities
    console.log('📝 Seeding facilities...');
    const facilities = [
      { name: 'Jinnah Hospital', type: 'hospital', location: `SRID=4326;POINT(74.3100 31.5497)`, city: 'Lahore' },
      { name: 'Civil Hospital Lahore', type: 'hospital', location: `SRID=4326;POINT(74.3300 31.5400)`, city: 'Lahore' },
      { name: 'Lahore Police', type: 'police_station', location: `SRID=4326;POINT(74.3500 31.5500)`, city: 'Lahore' },
      { name: 'DHA Police', type: 'police_station', location: `SRID=4326;POINT(74.3600 31.5600)`, city: 'Lahore' },
      { name: 'Pakistan School', type: 'school', location: `SRID=4326;POINT(74.3400 31.5400)`, city: 'Lahore' },
      { name: 'Al-Ameen School', type: 'school', location: `SRID=4326;POINT(74.3700 31.5300)`, city: 'Lahore' },
      { name: 'Thokar Market', type: 'market', location: `SRID=4326;POINT(74.3200 31.5600)`, city: 'Lahore' },
      { name: 'Liberty Market', type: 'market', location: `SRID=4326;POINT(74.3400 31.5200)`, city: 'Lahore' },
    ];

    for (const facility of facilities) {
      await client.query(
        `INSERT INTO facilities (name, type, location, city)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [facility.name, facility.type, facility.location, facility.city]
      );
    }
    console.log('✅ Facilities seeded');

    // 6. Seed Property History
    console.log('📝 Seeding property history...');
    const propertyHistory = [
      {
        property_id: 'prop-1',
        event_type: 'ownership_change',
        title: 'Ownership transferred',
        description: 'Property transferred to current owner',
        severity: 'low',
        event_date: '2023-01-15',
      },
      {
        property_id: 'prop-2',
        event_type: 'complaint',
        title: 'Noise complaint',
        description: 'Neighbor reported noise during construction',
        severity: 'low',
        event_date: '2022-06-20',
      },
      {
        property_id: 'prop-3',
        event_type: 'flood_event',
        title: 'Minor flooding during monsoon',
        description: 'Light water accumulation in basement during heavy rain',
        severity: 'medium',
        event_date: '2021-09-10',
      },
    ];

    for (const history of propertyHistory) {
      await client.query(
        `INSERT INTO property_history 
         (property_id, event_type, title, description, severity, event_date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [history.property_id, history.event_type, history.title, history.description, history.severity, history.event_date, true]
      );
    }
    console.log('✅ Property history seeded');

    await client.query('COMMIT');
    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seedData();
