const fs = require("fs");
const Customer = require("./../models/customerModel");
const { query } = require("express");

const getCustomers = async (req, res, next) => {
  try {
    // 1. basic filter
    const queryObject = { ...req.query };
    const excludeColumn = ['page', 'sort', 'limit', 'fields'];
    excludeColumn.forEach((el) => delete queryObject[el]);

    console.log(req.query, queryObject);

    // 2. advance filter
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryStr = JSON.parse(queryStr);

    let query = Customer.find(queryStr);

    // 3. sorting
    // sorting ASCENDING = name, kalau DESCENDING pake -name
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // 4. field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // 5. pagination
    // page=3&limit2 ===> data ke 5 dan 6
    const page = req.query.page * 1 || 2;
    const limit = req.query.limit * 1 || 2;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if(req.query.page) {
      const numCustomers = await Customer.countDocuments();
      if (skip > numCustomers) throw new Error("page does not exits!")
    }

    // eksekusi query
    const customers = await query;

    res.status(200).json({
      status: "success",
      totalData: customers.length,
      requestAt: req.requestTime,
      data: {
        customers,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const customer = await Customer.findById(id);
    res.status(200).json({
      status: "success",
      data: {
        customer,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const id = req.params.id;

    const customer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "berhasil update data",
      data: {
        customer,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const id = req.params.id;

    await Customer.findByIdAndDelete(id);

    res.status(204).json({
      status: "success",
      message: "berhasil delete data",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        customer: newCustomer,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
