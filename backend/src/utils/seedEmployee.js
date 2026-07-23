require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedEmployee = async () => {
  await connectDB();
  try {
    const admin = await User.findOne({ email: 'admin@testcorp.com' });
    if (!admin) {
      console.error('Error: Company Admin admin@testcorp.com not found. Run testSystem.js first.');
      process.exit(1);
    }

    const existingEmployee = await User.findOne({ email: 'employee@testcorp.com' });
    if (existingEmployee) {
      console.log('Employee account already exists.');
    } else {
      await User.create({
        name: 'Test Employee',
        email: 'employee@testcorp.com',
        password: 'employee123', // Will be hashed by userSchema pre-save hook
        role: 'Employee',
        companyId: admin.companyId,
        departmentId: admin.departmentId,
        isVerified: true,
        status: 'Active'
      });
      console.log('Employee account successfully seeded.');
    }

    console.log('\n=============================================');
    console.log('   STANDARD EMPLOYEE LOGIN DETAILS');
    console.log('=============================================');
    console.log('Email:    employee@testcorp.com');
    console.log('Password: employee123');
    console.log('Tenant:   Validation Test Corp');
    console.log('Role:     Employee');
    console.log('=============================================\n');

  } catch (error) {
    console.error('Failed to seed employee:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedEmployee();
