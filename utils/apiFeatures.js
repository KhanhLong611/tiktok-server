class APIFeatures {
  constructor(query, queryString, populateOption) {
    this.query = query; // Query object
    this.queryString = queryString; // Query parameters object which will be converted into string
    this.populateOption = populateOption; //
  }

  // Filter results by query parameters (gt, gte, lt, lte...)
  filter() {
    // 1A) Filtering the query parameter string
    const queryObject = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObject[field]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // Sort results by query parameters (createdAt, likes, comments...)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(`${sortBy} _id`);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  // Limit fields of the results returned
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  // Paginate results
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  populate() {
    this.query = this.query.populate(this.populateOption);

    return this;
  }
}

module.exports = APIFeatures;
