import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Plus, Database, Table, BarChart3, LineChart, PieChart, X, Loader } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#dc2626', '#059669', '#ea580c', '#16a34a', '#db2777', '#0f766e'];

const OzellestirPage = () => {
  const [dashboards, setDashboards] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(false);
  const [editingDashboardId, setEditingDashboardId] = useState(null);
  const [editingDashboardMeta, setEditingDashboardMeta] = useState(null);
  
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    tableName: '',
    columns: [],
    viewType: 'table', // table, bar, line, pie
    limit: 100,
    columnAliases: {}
  });

  const formatDisplayValue = (value, { fallback = '-' } = {}) => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'string') {
      const isoDateMatch = value.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2})(?::[0-9]{2})?(?:\.[0-9]+)?Z?$/);
      if (isoDateMatch) {
        return `${isoDateMatch[1]} ${isoDateMatch[2]}`;
      }
    }

    return String(value);
  };

  const isNumericValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue);
  };

  const chartInfo = useMemo(() => {
    if (!selectedDashboard || dashboardData.length === 0) {
      return { data: [], categoryKey: null, valueKeys: [] };
    }

    const columns = selectedDashboard.columns || [];
    const valueKeys = columns.filter((col) =>
      dashboardData.some((row) => isNumericValue(row[col]))
    );

    const categoryKey =
      columns.find((col) => !valueKeys.includes(col)) ||
      columns[0] ||
      '__index';

    const data = dashboardData.map((row, idx) => {
      const entry = {};
      entry[categoryKey] =
        categoryKey === '__index'
          ? `Kayıt ${idx + 1}`
          : row[categoryKey] !== null && row[categoryKey] !== undefined
            ? formatDisplayValue(row[categoryKey], { fallback: `Kayıt ${idx + 1}` })
            : `Kayıt ${idx + 1}`;

      valueKeys.forEach((key) => {
        const numericValue = Number(row[key]);
        entry[key] = Number.isFinite(numericValue) ? numericValue : 0;
      });

      return entry;
    });

    return {
      data,
      categoryKey,
      valueKeys
    };
  }, [dashboardData, selectedDashboard]);

  const renderDataTable = (data, columns, { dense = false, standalone = true } = {}, aliasMap = {}) => (
    <div
      className={`rounded-xl border border-gray-200 bg-white ${dense ? 'shadow-sm' : 'shadow-md'} ${standalone ? '' : 'h-full flex flex-col overflow-hidden'}`}
    >
      <div className={`${standalone ? '' : 'flex-1 overflow-auto'}`}>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase"
                >
                  {(() => {
                    const alias = aliasMap[col];
                    if (typeof alias === 'string') {
                      const trimmed = alias.trim();
                      if (trimmed.length > 0) {
                        return trimmed;
                      }
                    }
                    return col;
                  })()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                {columns.map((col) => (
                  <td key={col} className={`px-4 ${dense ? 'py-2' : 'py-3'} text-gray-900 whitespace-nowrap`}>
                    {formatDisplayValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBarChart = () => {
    if (!chartInfo.valueKeys.length) {
      return (
        <div className="text-center text-gray-500">
          Seçilen kolonlarda grafik için sayısal veri bulunamadı.
        </div>
      );
    }

    const aliasMap = selectedDashboard?.columnAliases || {};

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={chartInfo.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartInfo.categoryKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, (typeof aliasMap[name] === 'string' && aliasMap[name].trim().length > 0) ? aliasMap[name].trim() : name]} />
            <Legend />
            {chartInfo.valueKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={(typeof aliasMap[key] === 'string' && aliasMap[key].trim().length > 0) ? aliasMap[key].trim() : key}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!chartInfo.valueKeys.length) {
      return (
        <div className="text-center text-gray-500">
          Seçilen kolonlarda grafik için sayısal veri bulunamadı.
        </div>
      );
    }

    const aliasMap = selectedDashboard?.columnAliases || {};

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={chartInfo.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartInfo.categoryKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, (typeof aliasMap[name] === 'string' && aliasMap[name].trim().length > 0) ? aliasMap[name].trim() : name]} />
            <Legend />
            {chartInfo.valueKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={(typeof aliasMap[key] === 'string' && aliasMap[key].trim().length > 0) ? aliasMap[key].trim() : key}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!chartInfo.valueKeys.length) {
      return (
        <div className="text-center text-gray-500">
          Seçilen kolonlarda grafik için sayısal veri bulunamadı.
        </div>
      );
    }

    const valueKey = chartInfo.valueKeys[0];
    const aliasMap = selectedDashboard?.columnAliases || {};
    const pieData = chartInfo.data
      .map((entry) => ({
        name: formatDisplayValue(entry[chartInfo.categoryKey], { fallback: 'Belirtilmemiş' }),
        value: Number(entry[valueKey]) || 0
      }))
      .filter((item) => Number.isFinite(item.value));

    if (!pieData.length) {
      return (
        <div className="text-center text-gray-500">
          Pasta grafik için kullanılabilir veri bulunamadı.
        </div>
      );
    }

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Tooltip formatter={(value) => [value, (typeof aliasMap[valueKey] === 'string' && aliasMap[valueKey].trim().length > 0) ? aliasMap[valueKey].trim() : valueKey]} />
            <Legend />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={140}
              innerRadius={60}
              paddingAngle={4}
            >
              {pieData.map((entry, idx) => (
                <Cell key={`slice-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
          </RePieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDashboardContent = () => {
    if (!selectedDashboard) {
      return null;
    }

    if (dashboardData.length === 0) {
      return (
        <div className="text-center text-gray-500">
          Gösterilecek veri bulunamadı.
        </div>
      );
    }

    const columns = selectedDashboard.columns || [];
    const aliasMap = selectedDashboard.columnAliases || {};

    switch (selectedDashboard.viewType) {
      case 'bar':
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {renderBarChart()}
            </div>
            {renderDataTable(dashboardData, columns, { dense: true, standalone: false }, aliasMap)}
          </div>
        );
      case 'line':
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {renderLineChart()}
            </div>
            {renderDataTable(dashboardData, columns, { dense: true, standalone: false }, aliasMap)}
          </div>
        );
      case 'pie':
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-medium text-gray-500">
                Pasta grafik, seçilen ilk sayısal kolonun değerlerini kullanır.
              </p>
              {renderPieChart()}
            </div>
            {renderDataTable(dashboardData, columns, { dense: true, standalone: false }, aliasMap)}
          </div>
        );
      default:
        return renderDataTable(dashboardData, columns, {}, aliasMap);
    }
  };

  // localStorage'dan dashboard'ları yükle
  useEffect(() => {
    const savedDashboards = localStorage.getItem('custom_dashboards');
    if (savedDashboards) {
      try {
        const parsed = JSON.parse(savedDashboards);
        if (Array.isArray(parsed)) {
          setDashboards(parsed.map(dashboard => ({
            ...dashboard,
            columnAliases: dashboard.columnAliases || {}
          })));
        }
      } catch (error) {
        console.error('Dashboard verileri okunamadı:', error);
      }
    }
  }, []);

  // Tabloları yükle
  const loadTables = async () => {
    setLoadingTables(true);
    try {
      const response = await databaseAPI.getAllTables();
      if (response.data.success) {
        setTables(response.data.tables);
      } else {
        toast.error('Tablolar yüklenemedi');
      }
    } catch (error) {
      toast.error(error.message || 'Tablolar yüklenemedi');
    } finally {
      setLoadingTables(false);
    }
  };

  // Tablo seçildiğinde columnları yükle
  const loadColumns = async (tableName, options = {}) => {
    if (!tableName) return;

    const {
      preselectedColumns = [],
      updateDashboardColumns = true,
      columnAliases: incomingAliases = {}
    } = options;
    
    setLoadingColumns(true);
    setSelectedTable(tableName);
    setColumns([]);
    setSelectedColumns([]);
    setTableData([]);
    
    try {
      const response = await databaseAPI.getTableColumns(tableName);
      if (response.data.success) {
        const fetchedColumns = response.data.columns;
        setColumns(fetchedColumns);

        if (preselectedColumns.length > 0) {
          setSelectedColumns(preselectedColumns);
        }

        setNewDashboard(prev => ({
          ...prev,
          tableName,
          columns: updateDashboardColumns
            ? (preselectedColumns.length > 0 ? preselectedColumns : [])
            : prev.columns,
          columnAliases: (() => {
            const previousAliases = { ...prev.columnAliases };
            const sourceAliases = incomingAliases || {};

            if (!updateDashboardColumns) {
              const merged = { ...previousAliases };
              Object.entries(sourceAliases).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  const trimmed = value.trim();
                  if (trimmed.length > 0) {
                    merged[key] = trimmed;
                  }
                }
              });
              return merged;
            }

            const nextAliases = {};
            const columnsToSeed = preselectedColumns.length > 0 ? preselectedColumns : [];
            columnsToSeed.forEach((col) => {
              const sourceAlias = sourceAliases[col];
              if (typeof sourceAlias === 'string') {
                const trimmed = sourceAlias.trim();
                if (trimmed.length > 0) {
                  nextAliases[col] = trimmed;
                  return;
                }
              }
              const previousAlias = previousAliases[col];
              if (typeof previousAlias === 'string' && previousAlias.trim().length > 0) {
                nextAliases[col] = previousAlias.trim();
              } else {
                nextAliases[col] = col;
              }
            });
            return nextAliases;
          })()
        }));
      } else {
        toast.error('Kolonlar yüklenemedi');
      }
    } catch (error) {
      toast.error(error.message || 'Kolonlar yüklenemedi');
    } finally {
      setLoadingColumns(false);
    }
  };

  // Column seçimi
  const toggleColumn = (columnName) => {
    let updatedColumns;

    if (selectedColumns.includes(columnName)) {
      updatedColumns = selectedColumns.filter(col => col !== columnName);
    } else {
      updatedColumns = [...selectedColumns, columnName];
    }

    setSelectedColumns(updatedColumns);
    setNewDashboard(prev => {
      const updatedAliases = { ...prev.columnAliases };
      if (updatedColumns.includes(columnName)) {
        updatedAliases[columnName] = updatedAliases[columnName] || columnName;
      } else {
        delete updatedAliases[columnName];
      }
      return {
        ...prev,
        columns: updatedColumns,
        columnAliases: updatedAliases
      };
    });
    setTableData([]);
  };

  const fetchPreviewData = async ({
    tableName: tableNameParam,
    columns: columnsParam,
    limit = 10,
    updateDashboardColumns = true,
    showValidationErrors = true
  } = {}) => {
    const tableNameToUse = tableNameParam || selectedTable;
    const columnsToUse = columnsParam || selectedColumns;

    if (!tableNameToUse || !columnsToUse || columnsToUse.length === 0) {
      if (showValidationErrors) {
      toast.error('Lütfen tablo ve en az bir kolon seçin');
      }
      return;
    }

    setLoadingData(true);
    try {
      const response = await databaseAPI.getTableData(tableNameToUse, columnsToUse, limit);
      if (response.data.success) {
        setTableData(response.data.data);
        if (updateDashboardColumns) {
          setNewDashboard(prev => {
            const updatedAliases = { ...prev.columnAliases };
            columnsToUse.forEach((col) => {
              updatedAliases[col] = updatedAliases[col] || col;
            });
            return {
              ...prev,
              columns: columnsToUse,
              columnAliases: updatedAliases
            };
          });
        }
      } else {
        toast.error('Veriler yüklenemedi');
      }
    } catch (error) {
      toast.error(error.message || 'Veriler yüklenemedi');
    } finally {
      setLoadingData(false);
    }
  };

  // Önizleme verilerini yükle
  const loadPreviewData = () => fetchPreviewData({});

  const handleAliasChange = (columnName, alias) => {
    setNewDashboard(prev => ({
      ...prev,
      columnAliases: {
        ...prev.columnAliases,
        [columnName]: alias
      }
    }));
  };

  // Dashboard kaydet
  const saveDashboard = () => {
    if (!newDashboard.name || !newDashboard.tableName || newDashboard.columns.length === 0) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    const sanitizedColumns = [...newDashboard.columns];
    const sanitizedAliases = {};
    sanitizedColumns.forEach((col) => {
      const alias = newDashboard.columnAliases?.[col];
      if (typeof alias === 'string') {
        const trimmed = alias.trim();
        if (trimmed.length > 0) {
          sanitizedAliases[col] = trimmed;
        }
      }
    });

    const baseDashboardData = {
      ...newDashboard,
      columns: sanitizedColumns,
      columnAliases: sanitizedAliases,
      limit: newDashboard.limit || 100
    };

    if (editingDashboardId) {
      const updatedDashboards = dashboards.map((dashboard) => {
        if (dashboard.id !== editingDashboardId) {
          return dashboard;
        }

        return {
          ...dashboard,
          ...baseDashboardData,
          tableName: baseDashboardData.tableName,
          createdAt: editingDashboardMeta?.createdAt || dashboard.createdAt,
          updatedAt: new Date().toISOString()
        };
      });

      setDashboards(updatedDashboards);
      localStorage.setItem('custom_dashboards', JSON.stringify(updatedDashboards));
      toast.success('Dashboard başarıyla güncellendi');
    } else {
    const dashboard = {
      id: Date.now().toString(),
        ...baseDashboardData,
      createdAt: new Date().toISOString()
    };

    const updatedDashboards = [...dashboards, dashboard];
    setDashboards(updatedDashboards);
    localStorage.setItem('custom_dashboards', JSON.stringify(updatedDashboards));
      toast.success('Dashboard başarıyla oluşturuldu');
    }
    
    setShowCreateModal(false);
    resetForm();
  };

  // Formu sıfırla
  const resetForm = () => {
    setNewDashboard({
      name: '',
      tableName: '',
      columns: [],
      viewType: 'table',
      limit: 100,
      columnAliases: {}
    });
    setSelectedTable('');
    setColumns([]);
    setSelectedColumns([]);
    setTableData([]);
    setEditingDashboardId(null);
    setEditingDashboardMeta(null);
  };

  // Dashboard sil
  const deleteDashboard = (id) => {
    if (window.confirm('Bu dashboard\'u silmek istediğinize emin misiniz?')) {
      const updatedDashboards = dashboards.filter(d => d.id !== id);
      setDashboards(updatedDashboards);
      localStorage.setItem('custom_dashboards', JSON.stringify(updatedDashboards));
      toast.success('Dashboard silindi');
    }
  };

  const handleEditDashboard = async (dashboard) => {
    setEditingDashboardId(dashboard.id);
    setEditingDashboardMeta(dashboard);
    setNewDashboard({
      name: dashboard.name,
      tableName: dashboard.tableName,
      columns: dashboard.columns,
      viewType: dashboard.viewType || 'table',
      limit: dashboard.limit || 100,
      columnAliases: dashboard.columnAliases || {}
    });
    setSelectedTable(dashboard.tableName);
    setTableData([]);
    setShowCreateModal(true);

    await loadColumns(dashboard.tableName, {
      preselectedColumns: dashboard.columns,
      updateDashboardColumns: true,
      columnAliases: dashboard.columnAliases || {}
    });

    if (dashboard.columns && dashboard.columns.length > 0) {
      await fetchPreviewData({
        tableName: dashboard.tableName,
        columns: dashboard.columns,
        limit: Math.min(dashboard.limit || 100, 10),
        updateDashboardColumns: false,
        showValidationErrors: false
      });
    }
  };

  const handleViewDashboard = async (dashboard) => {
    setSelectedDashboard(dashboard);
    setDashboardData([]);
    setViewModalOpen(true);
    setLoadingDashboardData(true);

    try {
      const response = await databaseAPI.getTableData(
        dashboard.tableName,
        dashboard.columns,
        dashboard.limit || 100
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        toast.error('Dashboard verileri alınamadı');
      }
    } catch (error) {
      toast.error(error.message || 'Dashboard verileri alınamadı');
    } finally {
      setLoadingDashboardData(false);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedDashboard(null);
    setDashboardData([]);
    setLoadingDashboardData(false);
  };

  // Modal açıldığında tabloları yükle
  useEffect(() => {
    if (showCreateModal) {
      loadTables();
    }
  }, [showCreateModal]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Özelleştir
            </h1>
            <p className="text-gray-600">Özel dashboard'lar oluşturun ve verilerinizi görselleştirin</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Dashboard
          </button>
        </div>

        {/* Dashboard Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {dashboard.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Tablo:</span> {dashboard.tableName}
                    </div>
                    <div>
                      <span className="font-medium">Kolonlar:</span> {dashboard.columns.length}
                    </div>
                    <div>
                      <span className="font-medium">Görünüm:</span> {
                        dashboard.viewType === 'table' ? 'Tablo' :
                        dashboard.viewType === 'bar' ? 'Çubuk Grafik' :
                        dashboard.viewType === 'line' ? 'Çizgi Grafik' :
                        'Pasta Grafik'
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDashboard(dashboard.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Sil"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditDashboard(dashboard)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleViewDashboard(dashboard)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Görüntüle
                </button>
              </div>
            </div>
          ))}
        </div>

        {dashboards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Sliders className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz dashboard yok</h3>
            <p className="text-gray-500 mb-4">Yeni bir dashboard oluşturarak başlayın</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Yeni Dashboard Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Yeni Dashboard Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sliders className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDashboardId ? 'Dashboard Düzenle' : 'Yeni Dashboard Oluştur'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dashboard Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dashboard Adı *
                </label>
                <input
                  type="text"
                  value={newDashboard.name}
                  onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: CPU Kullanım Analizi"
                  required
                />
              </div>

              {/* Tablo Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tablo Seçin *
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTable}
                    onChange={(e) => loadColumns(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingTables}
                  >
                    <option value="">Tabloyu seçin...</option>
                    {tables.map((table) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={loadTables}
                    disabled={loadingTables}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400"
                  >
                    {loadingTables ? <Loader className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Kolonlar */}
              {columns.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Kolonları Seçin * ({selectedColumns.length} seçili)
                    </label>
                    <button
                      onClick={loadPreviewData}
                      disabled={selectedColumns.length === 0 || loadingData}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
                    >
                      {loadingData ? 'Yükleniyor...' : 'Önizleme'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg">
                    {columns.map((column) => (
                      <label
                        key={column.column_name}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-colors ${
                          selectedColumns.includes(column.column_name)
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column.column_name)}
                          onChange={() => toggleColumn(column.column_name)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {column.column_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {column.data_type}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedColumns.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Kolon Takma İsimleri
                      </label>
                      <div className="space-y-2">
                        {selectedColumns.map((column) => (
                          <div key={column} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide sm:w-48">
                              {column}
                            </span>
                            <input
                              type="text"
                              value={newDashboard.columnAliases[column] ?? ''}
                              onChange={(e) => handleAliasChange(column, e.target.value)}
                              placeholder="Takma isim (opsiyonel)"
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Önizleme Verileri */}
              {tableData.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Önizleme (İlk 10 kayıt)
                  </label>
                  {renderDataTable(tableData, selectedColumns, { dense: true }, newDashboard.columnAliases)}
                </div>
              )}

              {/* Görünüm Tipi */}
              {selectedColumns.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görünüm Tipi *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'table', label: 'Tablo', icon: Table },
                      { value: 'bar', label: 'Çubuk Grafik', icon: BarChart3 },
                      { value: 'line', label: 'Çizgi Grafik', icon: LineChart },
                      { value: 'pie', label: 'Pasta Grafik', icon: PieChart }
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer border-2 transition-colors ${
                          newDashboard.viewType === type.value
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="viewType"
                          value={type.value}
                          checked={newDashboard.viewType === type.value}
                          onChange={(e) => setNewDashboard({ ...newDashboard, viewType: e.target.value })}
                          className="sr-only"
                        />
                        <type.icon className="w-6 h-6 text-gray-700" />
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kayıt Limiti
                </label>
                <input
                  type="number"
                  value={newDashboard.limit}
                  onChange={(e) => setNewDashboard({ ...newDashboard, limit: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveDashboard}
                disabled={!newDashboard.name || !newDashboard.tableName || newDashboard.columns.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingDashboardId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-[90vw] max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-10 py-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedDashboard?.name || 'Dashboard'}</h2>
                <p className="text-sm text-gray-500">{selectedDashboard?.tableName}</p>
              </div>
              <button
                onClick={closeViewModal}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 px-10 py-6">
              {loadingDashboardData ? (
                <div className="flex h-64 items-center justify-center text-gray-500">
                  <Loader className="mr-2 h-6 w-6 animate-spin" />
                  Veriler yükleniyor...
                </div>
              ) : (
                renderDashboardContent()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OzellestirPage;

