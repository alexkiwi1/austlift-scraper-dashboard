import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import type { Product } from '../types';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, product: Product) => React.ReactNode;
}

interface ProductsTableProps {
  products: Product[];
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  columns: Column[];
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Reusable Products Table component with sorting, filtering, and pagination
 * @param {ProductsTableProps} props - Component props
 * @param {Product[]} props.products - Array of products to display
 * @param {boolean} props.isMinimized - Whether the table is minimized
 * @param {() => void} props.onToggleMinimize - Function to toggle minimize state
 * @param {() => void} props.onClose - Function to close the table
 * @param {Column[]} [props.columns] - Optional custom columns configuration
 * @returns {React.JSX.Element} JSX element containing the products table
 */
const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  isMinimized,
  onToggleMinimize: _onToggleMinimize,
  onClose: _onClose,
  columns: customColumns,
}): React.JSX.Element => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  // Default columns if none provided
  const defaultColumns: Column[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    {
      key: 'image_url',
      label: 'Image',
      width: '100px',
      render: value =>
        value ? (
          <img
            src={String(value)}
            alt='Product'
            className='w-16 h-16 object-cover rounded'
          />
        ) : (
          '-'
        ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      filterable: true,
      width: '100px',
    },
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      width: '100px',
      render: value =>
        value && typeof value === 'number' ? `$${value.toFixed(2)}` : '-',
    },
    {
      key: 'list_price',
      label: 'List Price',
      sortable: true,
      width: '100px',
      render: value =>
        value && typeof value === 'number' ? `$${value.toFixed(2)}` : '-',
    },
    {
      key: 'dealer_price',
      label: 'Dealer Price',
      sortable: true,
      width: '110px',
      render: value =>
        value && typeof value === 'number' ? `$${value.toFixed(2)}` : '-',
    },
    { key: 'quantity_on_hand', label: 'Stock', sortable: true, width: '80px' },
    {
      key: 'in_stock',
      label: 'In Stock',
      width: '90px',
      render: value => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? '✅ Yes' : '❌ No'}
        </span>
      ),
    },
    {
      key: 'low_stock',
      label: 'Low Stock',
      width: '90px',
      render: value =>
        value ? (
          <span className='px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800'>
            ⚠️ Low
          </span>
        ) : null,
    },
    {
      key: 'is_variation',
      label: 'Variation',
      width: '90px',
      render: (value, product) =>
        value ? (
          <span className='px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800'>
            {product.variation_name || 'Yes'}
          </span>
        ) : null,
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      filterable: true,
      width: '120px',
    },
    {
      key: 'url',
      label: 'URL',
      width: '200px',
      render: value =>
        value ? (
          <a
            href={String(value)}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:underline truncate block'
            title={String(value)}
          >
            View
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'catalog_id',
      label: 'Catalog ID',
      sortable: true,
      width: '100px',
    },
    {
      key: 'source',
      label: 'Source',
      width: '90px',
    },
    {
      key: 'warehouse_stock',
      label: 'Warehouse Stock',
      width: '200px',
      render: value =>
        value && typeof value === 'object'
          ? Object.entries(value as Record<string, number>)
              .map(([key, val]) => `${key}: ${val}`)
              .join(', ')
          : '-',
    },
    {
      key: 'parent_product_url',
      label: 'Parent URL',
      width: '200px',
      render: value =>
        value ? (
          <a
            href={String(value)}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:underline truncate block'
          >
            View Parent
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'specification_pdfs',
      label: 'PDFs',
      width: '120px',
      render: (value, product) => {
        if (value && Array.isArray(value) && value.length > 0) {
          const pdfs = value as Array<{ name: string; path: string }>;
          return (
            <div className='flex flex-col gap-1'>
              {pdfs.slice(0, 2).map((pdf, idx) => (
                <a
                  key={idx}
                  href={`/${pdf.path}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-blue-600 hover:underline truncate'
                >
                  📄 {pdf.name}
                </a>
              ))}
              {pdfs.length > 2 && (
                <span className='text-xs text-gray-500'>
                  +{pdfs.length - 2} more
                </span>
              )}
            </div>
          );
        }
        return '-';
      },
    },
    {
      key: 'scraped_at',
      label: 'Scraped',
      sortable: true,
      width: '100px',
      render: value =>
        value && typeof value === 'string'
          ? new Date(value).toLocaleDateString()
          : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      width: '100px',
      render: value =>
        value && typeof value === 'string'
          ? new Date(value).toLocaleDateString()
          : '-',
    },
    {
      key: 'updated_at',
      label: 'Updated',
      sortable: true,
      width: '100px',
      render: value =>
        value && typeof value === 'string'
          ? new Date(value).toLocaleDateString()
          : '-',
    },
  ];

  const columns = customColumns.length > 0 ? customColumns : defaultColumns;

  // Filtered and sorted products
  const processedProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        Object.values(product).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof Product];
        const bValue = b[sortColumn as keyof Product];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [products, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = processedProducts.slice(startIndex, endIndex);

  const handleSort = (columnKey: string): void => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (columnKey: string): React.ReactNode => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className='w-4 h-4' />
    ) : (
      <ChevronDown className='w-4 h-4' />
    );
  };

  if (isMinimized) {
    return (
      <div className='text-center py-4 bg-gray-50 rounded-lg'>
        <p className='text-gray-600'>
          Table minimized - Click &quot;Expand&quot; to view{' '}
          {processedProducts.length} products
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Search and Controls */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search products...'
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Filter className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-600'>
              {processedProducts.length} of {products.length} products
            </span>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-600'>Show:</span>
          <select
            id='itemsPerPage'
            name='itemsPerPage'
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className='border border-gray-300 rounded px-2 py-1 text-sm'
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto bg-white rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className='flex items-center space-x-1'>
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {paginatedProducts.map((product, index) => (
              <tr
                key={product.id || `product-${startIndex + index}`}
                className='hover:bg-gray-50'
              >
                {columns.map(column => (
                  <td
                    key={`${product.id || startIndex + index}-${column.key}`}
                    className='px-4 py-3 text-sm text-gray-900'
                  >
                    {column.render
                      ? column.render(
                          product[column.key as keyof Product],
                          product
                        )
                      : String(product[column.key as keyof Product] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, processedProducts.length)} of{' '}
            {processedProducts.length} results
          </div>
          <div className='flex items-center space-x-2'>
            <button
              type='button'
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Previous
            </button>
            <span className='text-sm text-gray-700'>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type='button'
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className='px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
