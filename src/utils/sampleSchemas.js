export const SAMPLE_PROJECTS = [
  {
    id: 'proj-1',
    folderId: 'folder-1',
    name: 'E-Commerce Database',
    description: 'Online store core architecture with users, orders, products, and reviews.',
    updatedAt: new Date().toISOString(),
    dialect: 'postgres',
    accessMode: 'public',
    allowedEmails: [],
    tables: [
      {
        id: 'tbl-users',
        name: 'users',
        headerColor: '#3b82f6', // blue
        x: 60,
        y: 80,
        note: 'Stores customer and admin account authentication, roles, and profile timestamps.',
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Primary unique user auto-increment ID' },
          { name: 'email', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Unique account login email address' },
          { name: 'full_name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Full legal display name' },
          { name: 'password_hash', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Bcrypt hashed password' },
          { name: 'role', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Access level: admin | customer | guest' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Account registration timestamp' }
        ]
      },
      {
        id: 'tbl-orders',
        name: 'orders',
        headerColor: '#10b981', // green
        x: 420,
        y: 80,
        note: 'Customer purchase orders tracking billing status and grand total amounts.',
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Order reference ID' },
          { name: 'user_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to users.id' },
          { name: 'status', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Order state: pending | processing | shipped | completed' },
          { name: 'total_amount', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Final computed order price in USD' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Timestamp when order was placed' }
        ]
      },
      {
        id: 'tbl-products',
        name: 'products',
        headerColor: '#8b5cf6', // purple
        x: 60,
        y: 400,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'category_id', type: 'integer', isPk: false, isFk: true, isNull: true, isUnique: false, note: 'FK to categories.id' },
          { name: 'title', type: 'varchar(200)', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' },
          { name: 'sku', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'price', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' },
          { name: 'stock_quantity', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' }
        ]
      },
      {
        id: 'tbl-order_items',
        name: 'order_items',
        headerColor: '#f59e0b', // amber
        x: 420,
        y: 380,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'order_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'product_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'quantity', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' },
          { name: 'unit_price', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' }
        ]
      },
      {
        id: 'tbl-categories',
        name: 'categories',
        headerColor: '#ec4899', // pink
        x: 780,
        y: 400,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'slug', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: true, note: '' }
        ]
      },
      {
        id: 'tbl-reviews',
        name: 'reviews',
        headerColor: '#06b6d4', // cyan
        x: 780,
        y: 80,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'product_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'user_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'rating', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: '1 to 5 stars' },
          { name: 'comment', type: 'text', isPk: false, isFk: false, isNull: true, isUnique: false, note: '' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-1',
        fromTable: 'orders',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        cardinality: '1:N', // 1 user has many orders
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-2',
        fromTable: 'order_items',
        fromColumn: 'order_id',
        toTable: 'orders',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-3',
        fromTable: 'order_items',
        fromColumn: 'product_id',
        toTable: 'products',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-4',
        fromTable: 'products',
        fromColumn: 'category_id',
        toTable: 'categories',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'SET NULL'
      },
      {
        id: 'rel-5',
        fromTable: 'reviews',
        fromColumn: 'product_id',
        toTable: 'products',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-6',
        fromTable: 'reviews',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    history: [
      {
        id: 'v-initial',
        versionName: 'v1.0 - Initial Design',
        description: 'Baseline architecture for e-commerce core models',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        author: 'Alex Chen',
        tablesCount: 6,
        relationshipsCount: 6
      },
      {
        id: 'v-reviews',
        versionName: 'v1.1 - Added Reviews Module',
        description: 'Integrated user ratings and product feedback',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        author: 'Sarah Jenkins',
        tablesCount: 6,
        relationshipsCount: 6
      }
    ]
  },
  {
    id: 'proj-2',
    folderId: 'folder-2',
    name: 'SaaS Billing & Subscriptions',
    description: 'Multi-tenant organization hierarchy, plans, invoices, and payment tokens.',
    updatedAt: new Date().toISOString(),
    dialect: 'postgres',
    accessMode: 'public',
    allowedEmails: [],
    tables: [
      {
        id: 'tbl-orgs',
        name: 'organizations',
        headerColor: '#3b82f6',
        x: 80,
        y: 100,
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' },
          { name: 'slug', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: true, note: '' }
        ]
      },
      {
        id: 'tbl-subscriptions',
        name: 'subscriptions',
        headerColor: '#10b981',
        x: 450,
        y: 100,
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'org_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'plan_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: '' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'active | canceled' }
        ]
      },
      {
        id: 'tbl-plans',
        name: 'plans',
        headerColor: '#8b5cf6',
        x: 820,
        y: 100,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: '' },
          { name: 'code', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'pro | enterprise' },
          { name: 'monthly_price', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-saas-1',
        fromTable: 'subscriptions',
        fromColumn: 'org_id',
        toTable: 'organizations',
        toColumn: 'id',
        cardinality: '1:1',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-saas-2',
        fromTable: 'subscriptions',
        fromColumn: 'plan_id',
        toTable: 'plans',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    history: []
  }
];

export const INITIAL_FOLDERS = [
  { id: 'folder-1', name: 'My Schemas', icon: 'Database' },
  { id: 'folder-2', name: 'Archive', icon: 'Archive' }
];

export const INITIAL_DATABASES = INITIAL_FOLDERS;

export function createDefaultBlankProject(ownerUid = 'guest', ownerEmail = '') {
  return {
    id: `proj-${Date.now().toString(36)}`,
    folderId: 'folder-1',
    name: 'New Database',
    description: 'Blank database schema',
    updatedAt: new Date().toISOString(),
    dialect: 'postgres',
    accessMode: 'public',
    allowedEmails: [],
    tables: [],
    relationships: [],
    history: [],
    ownerUid,
    ownerEmail
  };
}
