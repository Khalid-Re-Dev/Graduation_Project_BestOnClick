import { createElementFromHTML, showToast } from "../utils/helpers.js?v=2024"
import { dashboardService, productService } from "../services/api.js"
import store from "../state/store.js"

/**
 * Product Management Page for Store Owners
 */
export default function ProductManagementPage() {
  const { user } = store.getState()
  
  if (!user || user.role !== 'store_owner') {
    return createElementFromHTML(`
      <div class="container mx-auto py-8 px-4">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-danger mb-4">Access Denied</h1>
          <p class="text-muted">You must be a store owner to access this page.</p>
        </div>
      </div>
    `)
  }

  const page = createElementFromHTML(`
    <div class="container mx-auto py-8 px-4">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-4xl font-extrabold mb-2">Product Management</h1>
          <p class="text-muted">Manage your store's products and inventory</p>
        </div>
        <button id="add-product-btn" class="btn btn-primary">
          <i class="fa-solid fa-plus mr-2"></i>
          Add New Product
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="card mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <input type="text" id="search-input" placeholder="Search by name or SKU..." class="input-field">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="category-filter" class="input-field">
              <option value="">All Categories</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status-filter" class="input-field">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <select id="stock-filter" class="input-field">
              <option value="">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Your Products</h2>
          <div class="flex gap-2">
            <button id="bulk-actions-btn" class="btn btn-outline" disabled>
              <i class="fa-solid fa-tasks mr-2"></i>
              Bulk Actions
            </button>
            <button id="export-btn" class="btn btn-outline">
              <i class="fa-solid fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div id="products-loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p class="mt-2 text-muted">Loading products...</p>
        </div>

        <!-- Products Table -->
        <div id="products-table" class="hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th class="text-left p-3">
                    <input type="checkbox" id="select-all" class="rounded">
                  </th>
                  <th class="text-left p-3">Product</th>
                  <th class="text-left p-3">Category</th>
                  <th class="text-left p-3">Price</th>
                  <th class="text-left p-3">Stock</th>
                  <th class="text-left p-3">Status</th>
                  <th class="text-left p-3">Rating</th>
                  <th class="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody id="products-tbody">
                <!-- Products will be loaded here -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div id="products-empty" class="hidden text-center py-12">
          <div class="text-muted text-6xl mb-4">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">No Products Found</h3>
          <p class="text-muted mb-6">Start by adding your first product to your store.</p>
          <button class="btn btn-primary" onclick="addNewProduct()">
            <i class="fa-solid fa-plus mr-2"></i>
            Add Your First Product
          </button>
        </div>

        <!-- Error State -->
        <div id="products-error" class="hidden text-center py-8">
          <div class="text-danger text-4xl mb-4">
            <i class="fa-solid fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-xl font-bold text-danger mb-2">Error Loading Products</h3>
          <p class="text-muted mb-4">Unable to load your products. Please try again.</p>
          <button id="retry-products" class="btn btn-primary">
            <i class="fa-solid fa-refresh mr-2"></i>
            Retry
          </button>
        </div>

        <!-- Pagination -->
        <div id="pagination" class="hidden flex justify-between items-center mt-6 pt-4 border-t">
          <div class="text-sm text-muted">
            Showing <span id="showing-from">1</span> to <span id="showing-to">10</span> of <span id="total-products">0</span> products
          </div>
          <div class="flex gap-2">
            <button id="prev-page" class="btn btn-outline" disabled>
              <i class="fa-solid fa-chevron-left mr-2"></i>
              Previous
            </button>
            <button id="next-page" class="btn btn-outline" disabled>
              Next
              <i class="fa-solid fa-chevron-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Actions Modal -->
    <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 id="modal-title" class="text-lg font-bold">Product Actions</h3>
            <button id="close-modal" class="text-gray-500 hover:text-gray-700">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div id="modal-content">
            <!-- Modal content will be loaded here -->
          </div>
        </div>
      </div>
    </div>
  `)

  // Initialize the page
  initializeProductManagement(page)

  return page
}

/**
 * Initialize product management
 */
async function initializeProductManagement(page) {
  try {
    // Setup event listeners
    setupEventListeners(page)
    
    // Load initial data
    await loadProducts(page)
    await loadCategories(page)

  } catch (error) {
    console.error('Product management initialization error:', error)
    showProductsError(page, error)
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners(page) {
  // Add product button
  page.querySelector('#add-product-btn').addEventListener('click', () => {
    location.hash = '#/products/add'
  })

  // Search and filters
  page.querySelector('#search-input').addEventListener('input', debounce(() => {
    loadProducts(page)
  }, 300))

  page.querySelector('#category-filter').addEventListener('change', () => {
    loadProducts(page)
  })

  page.querySelector('#status-filter').addEventListener('change', () => {
    loadProducts(page)
  })

  page.querySelector('#stock-filter').addEventListener('change', () => {
    loadProducts(page)
  })

  // Select all checkbox
  page.querySelector('#select-all').addEventListener('change', (e) => {
    const checkboxes = page.querySelectorAll('input[name="product-select"]')
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked
    })
    updateBulkActionsButton(page)
  })

  // Retry button
  page.querySelector('#retry-products').addEventListener('click', () => {
    loadProducts(page)
  })

  // Modal close
  page.querySelector('#close-modal').addEventListener('click', () => {
    page.querySelector('#product-modal').classList.add('hidden')
  })

  // Export button
  page.querySelector('#export-btn').addEventListener('click', () => {
    exportProducts()
  })
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Update bulk actions button state
 */
function updateBulkActionsButton(page) {
  const selectedCheckboxes = page.querySelectorAll('input[name="product-select"]:checked')
  const bulkActionsBtn = page.querySelector('#bulk-actions-btn')
  
  if (selectedCheckboxes.length > 0) {
    bulkActionsBtn.disabled = false
    bulkActionsBtn.textContent = `Bulk Actions (${selectedCheckboxes.length})`
  } else {
    bulkActionsBtn.disabled = true
    bulkActionsBtn.textContent = 'Bulk Actions'
  }
}

// Global functions
window.addNewProduct = function() {
  location.hash = '#/products/add'
}

window.exportProducts = function() {
  showToast("Export feature coming soon!", "info")
}

/**
 * Load products from backend
 */
async function loadProducts(page) {
  try {
    // Show loading state
    page.querySelector('#products-loading').classList.remove('hidden')
    page.querySelector('#products-table').classList.add('hidden')
    page.querySelector('#products-empty').classList.add('hidden')
    page.querySelector('#products-error').classList.add('hidden')

    // Get filter values
    const search = page.querySelector('#search-input').value
    const category = page.querySelector('#category-filter').value
    const status = page.querySelector('#status-filter').value
    const stock = page.querySelector('#stock-filter').value

    // For now, assume store ID is 1 (in real app, get from user's store)
    const storeId = 1

    console.log('Loading products for store:', storeId)
    const products = await dashboardService.getStoreProducts(storeId)
    console.log('Loaded products:', products)

    // Hide loading state
    page.querySelector('#products-loading').classList.add('hidden')

    if (!products || products.length === 0) {
      page.querySelector('#products-empty').classList.remove('hidden')
      return
    }

    // Filter products based on search and filters
    let filteredProducts = products

    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category_name === category
      )
    }

    if (status) {
      filteredProducts = filteredProducts.filter(product =>
        status === 'active' ? product.is_active : !product.is_active
      )
    }

    if (stock) {
      filteredProducts = filteredProducts.filter(product => {
        if (stock === 'in_stock') return product.in_stock && product.stock_quantity > 0
        if (stock === 'out_of_stock') return !product.in_stock || product.stock_quantity === 0
        if (stock === 'low_stock') return product.stock_quantity > 0 && product.stock_quantity <= 10
        return true
      })
    }

    // Render products table
    renderProductsTable(page, filteredProducts)

    // Show table
    page.querySelector('#products-table').classList.remove('hidden')

  } catch (error) {
    console.error('Error loading products:', error)
    showProductsError(page, error)
  }
}

/**
 * Render products table
 */
function renderProductsTable(page, products) {
  const tbody = page.querySelector('#products-tbody')

  tbody.innerHTML = products.map(product => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3">
        <input type="checkbox" name="product-select" value="${product.id}" class="rounded">
      </td>
      <td class="p-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <i class="fa-solid fa-box text-gray-500"></i>
          </div>
          <div>
            <p class="font-medium">${product.name}</p>
            <p class="text-sm text-muted">SKU: ${product.sku}</p>
          </div>
        </div>
      </td>
      <td class="p-3 text-muted">${product.category_name || 'N/A'}</td>
      <td class="p-3">
        <div>
          <span class="font-medium">$${product.final_price}</span>
          ${product.discount_percentage > 0 ? `
            <div class="text-xs text-muted">
              <span class="line-through">$${product.price}</span>
              <span class="text-success">${product.discount_percentage}% off</span>
            </div>
          ` : ''}
        </div>
      </td>
      <td class="p-3">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded text-xs ${getStockStatusClass(product)}">
            ${product.stock_quantity} units
          </span>
          <button onclick="toggleProductStock('${product.id}')"
                  class="text-sm ${product.in_stock ? 'text-success' : 'text-danger'}"
                  title="${product.in_stock ? 'Mark as out of stock' : 'Mark as in stock'}">
            <i class="fa-solid fa-toggle-${product.in_stock ? 'on' : 'off'}"></i>
          </button>
        </div>
      </td>
      <td class="p-3">
        <span class="px-2 py-1 rounded text-xs ${product.is_active ? 'bg-success text-white' : 'bg-gray-500 text-white'}">
          ${product.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="p-3">
        <div class="flex items-center gap-1">
          <span class="text-warning">
            ${renderStars(product.average_rating || 0)}
          </span>
          <span class="text-sm text-muted">(${product.total_reviews || 0})</span>
        </div>
      </td>
      <td class="p-3">
        <div class="flex gap-2">
          <button onclick="editProduct('${product.id}')"
                  class="text-secondary hover:text-blue-600"
                  title="Edit Product">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button onclick="viewProduct('${product.id}')"
                  class="text-primary hover:text-gray-600"
                  title="View Product">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button onclick="duplicateProduct('${product.id}')"
                  class="text-success hover:text-green-600"
                  title="Duplicate Product">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button onclick="showProductActions('${product.id}')"
                  class="text-muted hover:text-gray-600"
                  title="More Actions">
            <i class="fa-solid fa-ellipsis-v"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('')

  // Add event listeners for checkboxes
  const checkboxes = tbody.querySelectorAll('input[name="product-select"]')
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateBulkActionsButton(page)
    })
  })
}

/**
 * Get stock status CSS class
 */
function getStockStatusClass(product) {
  if (!product.in_stock || product.stock_quantity === 0) {
    return 'bg-danger text-white'
  } else if (product.stock_quantity <= 10) {
    return 'bg-warning text-white'
  } else {
    return 'bg-success text-white'
  }
}

/**
 * Render star rating
 */
function renderStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return '★'.repeat(fullStars) +
         (hasHalfStar ? '☆' : '') +
         '☆'.repeat(emptyStars)
}

/**
 * Load categories for filter
 */
async function loadCategories(page) {
  try {
    const categories = await productService.getCategories()
    const categorySelect = page.querySelector('#category-filter')

    categories.forEach(category => {
      const option = document.createElement('option')
      option.value = category.name
      option.textContent = category.name
      categorySelect.appendChild(option)
    })
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

/**
 * Show products error
 */
function showProductsError(page, error) {
  page.querySelector('#products-loading').classList.add('hidden')
  page.querySelector('#products-table').classList.add('hidden')
  page.querySelector('#products-empty').classList.add('hidden')
  page.querySelector('#products-error').classList.remove('hidden')
}

// Global product action functions
window.editProduct = function(productId) {
  location.hash = `#/products/edit/${productId}`
}

window.viewProduct = function(productId) {
  location.hash = `#/products/${productId}`
}

window.duplicateProduct = function(productId) {
  showToast("Duplicate product feature coming soon!", "info")
}

window.toggleProductStock = async function(productId) {
  try {
    const result = await dashboardService.toggleProductStock(productId)
    showToast(result.message, 'success')
    // Reload products to show updated status
    const page = document.querySelector('.container')
    loadProducts(page)
  } catch (error) {
    console.error('Error toggling stock:', error)
    showToast('Failed to update stock status', 'error')
  }
}

window.showProductActions = function(productId) {
  showToast("More product actions coming soon!", "info")
}
