module.exports = {
  _routing: {
    required: false
  },
  numeric_detection: false,
  dynamic_date_formats: [
    'strict_date_optional_time',
    'yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z'
  ],
  _meta: {},
  _source: {
    excludes: [],
    includes: [],
    enabled: true
  },
  dynamic: true,
  date_detection: true,
  properties: {
    severity: {
      eager_global_ordinals: false,
      norms: false,
      index: true,
      store: false,
      type: 'keyword',
      split_queries_on_whitespace: false,
      index_options: 'docs',
      doc_values: true
    },
    '@timestamp': {
      index: true,
      ignore_malformed: false,
      store: false,
      type: 'date',
      doc_values: true
    },
    service: {
      type: 'keyword'
    },
    meta: {
      type: 'object'
    },
    message: {
      type: 'text'
    }
  }
};
