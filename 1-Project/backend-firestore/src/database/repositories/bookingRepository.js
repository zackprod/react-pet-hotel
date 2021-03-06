const AbstractEntityRepository = require('./abstractEntityRepository');
const admin = require('firebase-admin');
const FirebaseQuery = require('../utils/firebaseQuery');
const Booking = require('../models/booking');

class BookingRepository extends AbstractEntityRepository {
  constructor() {
    super(new Booking());
  }

  async refreshTwoWayRelations(record, options) {
    await this.refreshTwoWayRelationOneToMany(
      record,
      'pet',
      'pet',
      'bookings',
      options,
    );
  }

  async destroyFromRelations(id, options) {
    await this.destroyRelationToMany(
      id,
      'pet',
      'bookings',
      options,
    );
  }

  async findById(id) {
    const record = await this.findDocument('booking', id);
    return this.populate(record);
  }

  async findAndCountAll(
    {
      requestedAttributes,
      filter,
      limit,
      offset,
      orderBy,
    } = {
      requestedAttributes: null,
      filter: null,
      limit: 0,
      offset: 0,
      orderBy: null,
    },
  ) {
    const query = FirebaseQuery.forList({
      limit,
      offset,
      orderBy: orderBy || 'createdAt_DESC',
    });

    if (filter) {
      if (filter.id) {
        query.appendId('id', filter.id);
      }

      if (filter.owner) {
        query.appendId('owner', filter.owner);
      }

      if (filter.pet) {
        query.appendId('pet', filter.pet);
      }

      if (filter.arrivalRange) {
        query.appendRange(
          'arrival',
          filter.arrivalRange,
        );
      }

      if (filter.departureRange) {
        query.appendRange(
          'departure',
          filter.departureRange,
        );
      }

      if (filter.status) {
        query.appendEqual('status', filter.status);
      }

      if (filter.feeRange) {
        query.appendRange(
          'fee',
          filter.feeRange,
        );
      }

      if (filter.createdAtRange) {
        query.appendRange(
          'createdAt',
          filter.createdAtRange,
        );
      }
    }

    const collection = await admin
      .firestore()
      .collection(`booking`)
      .get();

    const all = this.mapCollection(collection);
    const rows = await this.populateAll(query.rows(all));
    const count = query.count(all);

    return { rows, count };
  }

  async findAllAutocomplete(search, limit) {
    const query = FirebaseQuery.forAutocomplete({
      limit,
      orderBy: 'id_ASC',
    });

    if (search) {
      query.appendId('id', search);

    }

    const collection = await admin
      .firestore()
      .collection(`booking`)
      .get();

    const all = this.mapCollection(collection);
    const rows = query.rows(all);

    return rows.map((record) => ({
      id: record.id,
      label: record['id'],
    }));
  }

  async populateAll(records) {
    return await Promise.all(
      records.map((record) => this.populate(record)),
    );
  }

  async populate(record) {
    if (!record) {
      return record;
    }

    record.pet = await this.findRelation(
      'pet',
      record.pet,
    );

    record.owner = await this.findRelation(
      'user',
      record.owner,
    );

    return record;
  }
}

module.exports = BookingRepository;
