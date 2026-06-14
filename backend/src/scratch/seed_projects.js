const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../database.sqlite'));

const seedProjects = () => {
  const projects = [
    {
      name: 'Central Hub Redevelopment',
      location: 'Downtown Sector 4',
      description: 'High-scale urban redevelopment project focusing on commercial infrastructure, smart city integration, and sustainable green spaces.',
      manager_name: 'Sarah Jenkins',
      contact_phone: '+91 98765 43210',
      start_date: '2026-05-10',
      end_date: '2027-05-10',
      status: 'On-track',
      progress: 15,
      company_id: 1
    },
    {
      name: 'East-West Metro Corridor',
      location: 'Metropolitan Area',
      description: 'Underground metro tunnel construction and multi-level station development to connect major business districts. High precision civil engineering.',
      manager_name: 'Raj Malhotra',
      contact_phone: '+91 87654 32109',
      start_date: '2026-06-01',
      end_date: '2028-12-31',
      status: 'On-track',
      progress: 5,
      company_id: 1
    },
    {
      name: 'Solar Park Initiative',
      location: 'Desert Basin Region',
      description: 'Installation of a 500MW solar array and smart grid integration. Focus on renewable energy supply and regional power stability.',
      manager_name: 'Elena Rodriguez',
      contact_phone: '+91 76543 21098',
      start_date: '2026-05-15',
      end_date: '2026-11-15',
      status: 'On-track',
      progress: 25,
      company_id: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO projects (name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, company_id)
    VALUES (@name, @location, @description, @manager_name, @contact_phone, @start_date, @end_date, @status, @progress, @company_id)
  `);

  const insertMany = db.transaction((projs) => {
    for (const p of projs) stmt.run(p);
  });

  try {
    insertMany(projects);
    console.log('Successfully seeded 3 strategic project sites.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  }
};

seedProjects();
