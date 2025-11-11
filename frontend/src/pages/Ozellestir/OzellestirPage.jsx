import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Plus, Database, Table, BarChart3, LineChart, PieChart, X, Loader, Folder, FolderOpen, Edit2, Trash2, Move, MoreVertical, ChevronDown, ChevronRight, Palette, Image as ImageIcon } from 'lucide-react';
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
import { folderAPI, customDashboardAPI } from '../../services/customizationService';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#dc2626', '#059669', '#ea580c', '#16a34a', '#db2777', '#0f766e'];

const FOLDER_ICONS = [
  { value: 'folder', label: 'Klasör', icon: Folder },
  { value: 'database', label: 'Veritabanı', icon: Database },
  { value: 'bar-chart', label: 'Grafik', icon: BarChart3 },
  { value: 'sliders', label: 'Ayarlar', icon: Sliders },
];

const FOLDER_COLORS = [
  { value: 'blue', label: 'Mavi', color: 'bg-blue-500' },
  { value: 'green', label: 'Yeşil', color: 'bg-green-500' },
  { value: 'purple', label: 'Mor', color: 'bg-purple-500' },
  { value: 'orange', label: 'Turuncu', color: 'bg-orange-500' },
  { value: 'red', label: 'Kırmızı', color: 'bg-red-500' },
  { value: 'pink', label: 'Pembe', color: 'bg-pink-500' },
  { value: 'indigo', label: 'İndigo', color: 'bg-indigo-500' },
  { value: 'yellow', label: 'Sarı', color: 'bg-yellow-500' },
];

const VIEW_TYPE_META = {
  table: {
    label: 'Tablo',
    icon: Table,
    gradientClass: 'from-sky-500/20 via-sky-500/5 to-transparent',
    badgeClass: 'border border-sky-300/40 bg-sky-500/15 text-sky-100'
  },
  bar: {
    label: 'Çubuk Grafik',
    icon: BarChart3,
    gradientClass: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    badgeClass: 'border border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
  },
  line: {
    label: 'Çizgi Grafik',
    icon: LineChart,
    gradientClass: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
    badgeClass: 'border border-indigo-300/40 bg-indigo-500/15 text-indigo-100'
  },
  pie: {
    label: 'Pasta Grafik',
    icon: PieChart,
    gradientClass: 'from-rose-500/20 via-rose-500/5 to-transparent',
    badgeClass: 'border border-rose-300/40 bg-rose-500/15 text-rose-100'
  }
};

const OzellestirPage = () => {
  const [dashboards, setDashboards] = useState([]);
  const [folders, setFolders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [moveDashboardId, setMoveDashboardId] = useState(null);
  const [dbType, setDbType] = useState('postgresql'); // postgresql or mssql
  const [dbConnections, setDbConnections] = useState({ postgresql: [], mssql: [] });
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
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
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    tableName: '',
    columns: [],
    viewType: 'table', // table, bar, line, pie
    limit: 100,
    columnAliases: {},
    folderId: null,
    dbType: 'postgresql',
    connectionId: null
  });

  const [newFolder, setNewFolder] = useState({
    name: '',
    icon: 'folder',
    color: 'blue',
    description: ''
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

  const formatDateTime = (value) => {
    if (!value) {
      return '—';
    }

    try {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '—';
      }

      return new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      console.error('Tarih formatlanamadı:', error);
      return '—';
    }
  };

  const isNumericValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue);
  };

  // Grafik için tüm veriyi kullan
  const chartInfo = useMemo(() => {
    if (!selectedDashboard || dashboardData.length === 0) {
      return { data: [], categoryKey: null, valueKeys: [], statistics: {} };
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

    // Her valueKey için istatistikleri hesapla
    const statistics = {};
    valueKeys.forEach((key) => {
      const values = data.map((entry) => entry[key]).filter((v) => Number.isFinite(v));
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        statistics[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
        };
      }
    });

    return {
      data,
      categoryKey,
      valueKeys,
      statistics
    };
  }, [dashboardData, selectedDashboard]);

  const dashboardInsights = useMemo(() => {
    const baseDistribution = Object.keys(VIEW_TYPE_META).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    if (!dashboards.length) {
      return {
        total: 0,
        chartCount: 0,
        lastActivity: null,
        mostUsedViewType: null,
        viewDistribution: baseDistribution
      };
    }

    const distribution = { ...baseDistribution };
    let lastActivity = null;

    dashboards.forEach((dashboard) => {
      const type = VIEW_TYPE_META[dashboard.viewType] ? dashboard.viewType : 'table';
      distribution[type] = (distribution[type] || 0) + 1;

      const timestamp = dashboard.updatedAt || dashboard.createdAt;
      if (timestamp) {
        const candidate = new Date(timestamp);
        if (!Number.isNaN(candidate.getTime())) {
          if (!lastActivity || candidate > lastActivity) {
            lastActivity = candidate;
          }
        }
      }
    });

    const chartCount = dashboards.filter((dashboard) => dashboard.viewType && dashboard.viewType !== 'table').length;

    const mostUsedViewType = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .find(([, count]) => count > 0) || null;

    return {
      total: dashboards.length,
      chartCount,
      lastActivity,
      mostUsedViewType,
      viewDistribution: distribution
    };
  }, [dashboards]);

  const renderDataTable = (data, columns, { dense = false, standalone = true } = {}, aliasMap = {}) => (
    <div
      className={`rounded-xl border border-gray-200/50 bg-white/90 backdrop-blur-sm ${dense ? 'shadow-lg' : 'shadow-xl'} ${standalone ? '' : 'h-full flex flex-col overflow-hidden'}`}
    >
      <div className={`${standalone ? '' : 'flex-1 overflow-auto'} rounded-xl`}>
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3.5 text-left text-xs font-bold tracking-wide text-gray-700 uppercase border-b border-gray-200"
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
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-50"
              >
                {columns.map((col) => (
                  <td key={col} className={`px-4 ${dense ? 'py-2.5' : 'py-3.5'} text-gray-900 whitespace-nowrap font-medium`}>
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
    if (!chartInfo.valueKeys.length || !chartInfo.data.length) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Seçilen kolonlarda grafik için sayısal veri bulunamadı.</p>
          {chartInfo.data.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Veri yükleniyor veya veri bulunamadı.</p>
          )}
        </div>
      );
    }

    const aliasMap = selectedDashboard?.columnAliases || {};

    return (
      <div className="w-full">
        {/* İstatistikler */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {chartInfo.valueKeys.map((key, idx) => {
            const stats = chartInfo.statistics[key];
            const displayName = (typeof aliasMap[key] === 'string' && aliasMap[key].trim().length > 0) ? aliasMap[key].trim() : key;
            if (!stats) return null;
            
            return (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                  <span className="text-xs font-semibold text-gray-700">{displayName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Min:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.min.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ort:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.avg.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.max.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grafik */}
        <div className="w-full" style={{ height: '450px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={chartInfo.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chartInfo.categoryKey} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [value, (typeof aliasMap[name] === 'string' && aliasMap[name].trim().length > 0) ? aliasMap[name].trim() : name]} 
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
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
      </div>
    );
  };

  const renderLineChart = () => {
    if (!chartInfo.valueKeys.length || !chartInfo.data.length) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Seçilen kolonlarda grafik için sayısal veri bulunamadı.</p>
          {chartInfo.data.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Veri yükleniyor veya veri bulunamadı.</p>
          )}
        </div>
      );
    }

    const aliasMap = selectedDashboard?.columnAliases || {};

    return (
      <div className="w-full">
        {/* İstatistikler */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {chartInfo.valueKeys.map((key, idx) => {
            const stats = chartInfo.statistics[key];
            const displayName = (typeof aliasMap[key] === 'string' && aliasMap[key].trim().length > 0) ? aliasMap[key].trim() : key;
            if (!stats) return null;
            
            return (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                  <span className="text-xs font-semibold text-gray-700">{displayName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Min:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.min.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ort:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.avg.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max:</span>
                    <span className="ml-1 font-semibold text-gray-800">{stats.max.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grafik */}
        <div className="w-full" style={{ height: '450px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={chartInfo.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chartInfo.categoryKey} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [value, (typeof aliasMap[name] === 'string' && aliasMap[name].trim().length > 0) ? aliasMap[name].trim() : name]} 
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {chartInfo.valueKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={(typeof aliasMap[key] === 'string' && aliasMap[key].trim().length > 0) ? aliasMap[key].trim() : key}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
              ))}
            </ReLineChart>
          </ResponsiveContainer>
        </div>
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

  const renderDashboardCard = (dashboard, viewMeta) => {
    const isMenuOpen = openMenuId === dashboard.id;
    
    const getViewTypeStyles = (viewType) => {
      switch (viewType) {
        case 'table':
          return {
            iconBg: 'bg-gradient-to-br from-sky-50 to-sky-100',
            iconColor: 'text-sky-600',
            accent: 'from-sky-500 to-sky-600',
            badgeBg: 'bg-sky-100',
            badgeText: 'text-sky-700'
          };
        case 'bar':
          return {
            iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
            iconColor: 'text-emerald-600',
            accent: 'from-emerald-500 to-emerald-600',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-700'
          };
        case 'line':
          return {
            iconBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
            iconColor: 'text-indigo-600',
            accent: 'from-indigo-500 to-indigo-600',
            badgeBg: 'bg-indigo-100',
            badgeText: 'text-indigo-700'
          };
        case 'pie':
          return {
            iconBg: 'bg-gradient-to-br from-rose-50 to-rose-100',
            iconColor: 'text-rose-600',
            accent: 'from-rose-500 to-rose-600',
            badgeBg: 'bg-rose-100',
            badgeText: 'text-rose-700'
          };
        default:
          return {
            iconBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
            iconColor: 'text-gray-600',
            accent: 'from-gray-500 to-gray-600',
            badgeBg: 'bg-gray-100',
            badgeText: 'text-gray-700'
          };
      }
    };

    const styles = getViewTypeStyles(dashboard.viewType);

    return (
      <div
        key={dashboard.id}
        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 cursor-pointer"
        onClick={(e) => {
          // Menü butonuna veya menüye tıklanmışsa kartın onClick'ini çalıştırma
          if (e.target.closest('.menu-button') || e.target.closest('.menu-dropdown')) {
            return;
          }
          handleViewDashboard(dashboard);
        }}
      >
        {/* Gradient Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${styles.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Menü Butonu */}
        <div className="absolute top-4 right-4 z-10">
          <button
            className="menu-button p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(isMenuOpen ? null : dashboard.id);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Menü Dropdown */}
          {isMenuOpen && (
            <div
              className="menu-dropdown absolute right-0 top-11 z-50 w-44 rounded-lg border border-gray-200 bg-white shadow-xl py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  setMoveDashboardId(dashboard.id);
                  setShowMoveModal(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Move className="h-4 w-4" />
                <span className="font-medium">Taşı</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  handleEditDashboard(dashboard);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span className="font-medium">Düzenle</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  deleteDashboard(dashboard.id);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="font-medium">Sil</span>
              </button>
            </div>
          )}
        </div>

        {/* Kart İçeriği */}
        <div className="p-6 pr-12">
          {/* Icon ve Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className={`${styles.iconBg} p-3 rounded-xl shadow-sm`}>
              <viewMeta.icon className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${styles.badgeBg} ${styles.badgeText}`}>
              {viewMeta.label}
            </span>
          </div>

          {/* Dashboard Bilgileri */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{dashboard.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Database className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{dashboard.tableName}</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Table className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">{dashboard.columns.length} kolon</span>
              </div>
              {dashboard.updatedAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{formatDateTime(dashboard.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
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
            <div className="rounded-xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg min-h-[500px] flex flex-col">
              <div className="flex-1 min-h-0">
                {renderBarChart()}
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              {renderDataTable(dashboardData, columns, { dense: true, standalone: false }, aliasMap)}
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg min-h-[500px] flex flex-col">
              <div className="flex-1 min-h-0">
                {renderLineChart()}
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              {renderDataTable(dashboardData, columns, { dense: true, standalone: false }, aliasMap)}
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg">
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

  // API'dan dashboard'ları ve klasörleri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        // Klasörleri yükle
        const foldersResponse = await folderAPI.getFolders();
        if (foldersResponse.data.success) {
          setFolders(foldersResponse.data.folders);
        }

        // Dashboard'ları yükle
        const dashboardsResponse = await customDashboardAPI.getDashboards();
        if (dashboardsResponse.data.success) {
          const dashboards = dashboardsResponse.data.dashboards.map(dashboard => ({
            ...dashboard,
            columns: dashboard.columns,
            columnAliases: dashboard.column_aliases || {},
            viewType: dashboard.view_type || 'table',
            tableName: dashboard.table_name,
            dbType: dashboard.db_type || 'postgresql',
            connectionId: dashboard.connection_id,
            limit: dashboard.limit_rows || 100,
            folderId: dashboard.folder_id || null,
            createdAt: dashboard.created_at,
            updatedAt: dashboard.updated_at
          }));
          setDashboards(dashboards);
        }
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        toast.error('Veriler yüklenemedi');
      }

      // Veritabanı bağlantılarını yükle
      const postgresqlConnections = localStorage.getItem('postgresql_connections');
      const mssqlConnections = localStorage.getItem('mssql_connections');
      
      const pgConns = postgresqlConnections ? JSON.parse(postgresqlConnections) : [];
      const mssqlConns = mssqlConnections ? JSON.parse(mssqlConnections) : [];
      
      setDbConnections({
        postgresql: pgConns.filter(conn => conn.active),
        mssql: mssqlConns.filter(conn => conn.active)
      });

      // İlk aktif bağlantıyı seç
      if (pgConns.length > 0 && pgConns[0].active) {
        setSelectedConnectionId(pgConns[0].id);
        setNewDashboard(prev => ({ ...prev, connectionId: pgConns[0].id, dbType: 'postgresql' }));
      }
    };

    loadData();
  }, []);

  // Klasör oluştur
  const createFolder = async () => {
    if (!newFolder.name.trim()) {
      toast.error('Klasör adı gereklidir');
      return;
    }

    try {
      const response = await folderAPI.createFolder(newFolder);
      if (response.data.success) {
        const folder = response.data.folder;
        setFolders(prev => [...prev, folder]);
        toast.success('Klasör oluşturuldu');
        setShowFolderModal(false);
        setNewFolder({ name: '', icon: 'folder', color: 'blue', description: '' });
        setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));
      }
    } catch (error) {
      console.error('Klasör oluşturulurken hata:', error);
      toast.error(error.response?.data?.message || 'Klasör oluşturulamadı');
    }
  };

  // Klasör güncelle
  const updateFolder = async () => {
    if (!newFolder.name.trim()) {
      toast.error('Klasör adı gereklidir');
      return;
    }

    try {
      const response = await folderAPI.updateFolder(editingFolderId, newFolder);
      if (response.data.success) {
        const updatedFolder = response.data.folder;
        setFolders(prev => prev.map(folder => 
          folder.id === editingFolderId ? updatedFolder : folder
        ));
        toast.success('Klasör güncellendi');
        setShowFolderModal(false);
        setEditingFolderId(null);
        setNewFolder({ name: '', icon: 'folder', color: 'blue', description: '' });
      }
    } catch (error) {
      console.error('Klasör güncellenirken hata:', error);
      toast.error(error.response?.data?.message || 'Klasör güncellenemedi');
    }
  };

  // Klasör sil
  const deleteFolder = async (folderId) => {
    if (window.confirm('Bu klasörü silmek istediğinize emin misiniz? Klasör içindeki dashboard\'lar klasörsüz hale gelecektir.')) {
      try {
        const response = await folderAPI.deleteFolder(folderId);
        if (response.data.success) {
          // Klasörü state'den kaldır
          setFolders(prev => prev.filter(f => f.id !== folderId));
          // Dashboard'ların folderId'lerini güncelle (backend otomatik yapıyor ama UI'da da yapalım)
          setDashboards(prev => prev.map(dashboard =>
            dashboard.folderId === folderId
              ? { ...dashboard, folderId: null }
              : dashboard
          ));
          toast.success('Klasör silindi');
        }
      } catch (error) {
        console.error('Klasör silinirken hata:', error);
        toast.error(error.response?.data?.message || 'Klasör silinemedi');
      }
    }
  };

  // Klasör düzenleme modalını aç
  const handleEditFolder = (folder) => {
    setEditingFolderId(folder.id);
    setNewFolder({
      name: folder.name,
      icon: folder.icon || 'folder',
      color: folder.color || 'blue',
      description: folder.description || ''
    });
    setShowFolderModal(true);
  };

  // Klasör genişlet/daralt
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Dashboard'u klasöre taşı
  const moveDashboardToFolder = async (dashboardId, folderId) => {
    try {
      const response = await customDashboardAPI.moveDashboard(dashboardId, folderId);
      if (response.data.success) {
        const updatedDashboard = response.data.dashboard;
        setDashboards(prev => prev.map(dashboard =>
          dashboard.id === dashboardId
            ? { ...dashboard, folderId: updatedDashboard.folder_id, updatedAt: updatedDashboard.updated_at }
            : dashboard
        ));
        toast.success('Dashboard taşındı');
        setShowMoveModal(false);
        setMoveDashboardId(null);
      }
    } catch (error) {
      console.error('Dashboard taşınırken hata:', error);
      toast.error(error.response?.data?.message || 'Dashboard taşınamadı');
    }
  };

  // Klasörlere göre dashboard'ları grupla
  const groupedDashboards = useMemo(() => {
    const folderGroups = {};
    const ungrouped = [];

    folders.forEach(folder => {
      folderGroups[folder.id] = {
        folder,
        dashboards: []
      };
    });

    dashboards.forEach(dashboard => {
      if (dashboard.folderId && folderGroups[dashboard.folderId]) {
        folderGroups[dashboard.folderId].dashboards.push(dashboard);
      } else {
        ungrouped.push(dashboard);
      }
    });

    return { folderGroups, ungrouped };
  }, [dashboards, folders]);

  // Seçili bağlantıyı al
  const getSelectedConnection = () => {
    if (!selectedConnectionId) return null;
    const connections = dbConnections[dbType] || [];
    return connections.find(conn => conn.id === selectedConnectionId) || null;
  };

  // Connection config'i hazırla
  const getConnectionConfig = (connection) => {
    if (!connection) return null;
    return {
      type: dbType,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      password: connection.password
    };
  };

  // Tabloları yükle
  const loadTables = async () => {
    const connection = getSelectedConnection();
    if (!connection) {
      toast.error('Lütfen bir veritabanı bağlantısı seçin');
      return;
    }

    setLoadingTables(true);
    try {
      const config = getConnectionConfig(connection);
      const response = await databaseAPI.getAllTables(config);
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

    const connection = getSelectedConnection();
    if (!connection) {
      toast.error('Lütfen bir veritabanı bağlantısı seçin');
      return;
    }

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
      const config = getConnectionConfig(connection);
      const response = await databaseAPI.getTableColumns(tableName, config);
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
  const saveDashboard = async () => {
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

    const dashboardPayload = {
      name: newDashboard.name,
      tableName: newDashboard.tableName,
      columns: sanitizedColumns,
      columnAliases: sanitizedAliases,
      viewType: newDashboard.viewType || 'table',
      dbType: newDashboard.dbType || 'postgresql',
      connectionId: newDashboard.connectionId,
      limit: newDashboard.limit || 100,
      folderId: newDashboard.folderId || null
    };

    try {
      if (editingDashboardId) {
        const response = await customDashboardAPI.updateDashboard(editingDashboardId, dashboardPayload);
        if (response.data.success) {
          const updatedDashboard = response.data.dashboard;
          setDashboards(prev => prev.map(dashboard =>
            dashboard.id === editingDashboardId
              ? {
                  ...dashboard,
                  ...updatedDashboard,
                  columns: updatedDashboard.columns,
                  columnAliases: updatedDashboard.column_aliases || {},
                  viewType: updatedDashboard.view_type || 'table',
                  tableName: updatedDashboard.table_name,
                  dbType: updatedDashboard.db_type || 'postgresql',
                  connectionId: updatedDashboard.connection_id,
                  limit: updatedDashboard.limit_rows || 100,
                  folderId: updatedDashboard.folder_id || null,
                  createdAt: updatedDashboard.created_at,
                  updatedAt: updatedDashboard.updated_at
                }
              : dashboard
          ));
          toast.success('Dashboard başarıyla güncellendi');
        }
      } else {
        const response = await customDashboardAPI.createDashboard(dashboardPayload);
        if (response.data.success) {
          const newDashboard = response.data.dashboard;
          setDashboards(prev => [...prev, {
            ...newDashboard,
            columns: newDashboard.columns,
            columnAliases: newDashboard.column_aliases || {},
            viewType: newDashboard.view_type || 'table',
            tableName: newDashboard.table_name,
            dbType: newDashboard.db_type || 'postgresql',
            connectionId: newDashboard.connection_id,
            limit: newDashboard.limit_rows || 100,
            folderId: newDashboard.folder_id || null,
            createdAt: newDashboard.created_at,
            updatedAt: newDashboard.updated_at
          }]);
          toast.success('Dashboard başarıyla oluşturuldu');
        }
      }
      
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Dashboard kaydedilirken hata:', error);
      toast.error(error.response?.data?.message || 'Dashboard kaydedilemedi');
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    const connection = getSelectedConnection();
    setNewDashboard({
      name: '',
      tableName: '',
      columns: [],
      viewType: 'table',
      limit: 100,
      columnAliases: {},
      folderId: selectedFolderId,
      dbType: dbType,
      connectionId: connection?.id || null
    });
    setSelectedTable('');
    setColumns([]);
    setSelectedColumns([]);
    setTableData([]);
    setEditingDashboardId(null);
    setEditingDashboardMeta(null);
  };

  // Dashboard sil
  const deleteDashboard = async (id) => {
    if (window.confirm('Bu dashboard\'u silmek istediğinize emin misiniz?')) {
      try {
        const response = await customDashboardAPI.deleteDashboard(id);
        if (response.data.success) {
          setDashboards(prev => prev.filter(d => d.id !== id));
          toast.success('Dashboard silindi');
        }
      } catch (error) {
        console.error('Dashboard silinirken hata:', error);
        toast.error(error.response?.data?.message || 'Dashboard silinemedi');
      }
    }
  };

  const handleEditDashboard = async (dashboard) => {
    setEditingDashboardId(dashboard.id);
    setEditingDashboardMeta(dashboard);
    
    // Veritabanı tipini ve bağlantıyı ayarla
    if (dashboard.dbType) {
      setDbType(dashboard.dbType);
    }
    if (dashboard.connectionId) {
      setSelectedConnectionId(dashboard.connectionId);
    }
    
    setNewDashboard({
      name: dashboard.name,
      tableName: dashboard.tableName,
      columns: dashboard.columns,
      viewType: dashboard.viewType || 'table',
      limit: dashboard.limit || 100,
      columnAliases: dashboard.columnAliases || {},
      folderId: dashboard.folderId || null,
      dbType: dashboard.dbType || 'postgresql',
      connectionId: dashboard.connectionId || null
    });
    setSelectedTable(dashboard.tableName);
    setTableData([]);
    setShowCreateModal(true);

    // Bağlantı seçildikten sonra kolonları yükle
    if (dashboard.tableName) {
      await loadColumns(dashboard.tableName, {
        preselectedColumns: dashboard.columns,
        updateDashboardColumns: true,
        columnAliases: dashboard.columnAliases || {}
      });
    }
  };

  const handleViewDashboard = async (dashboard) => {
    setSelectedDashboard(dashboard);
    setDashboardData([]);
    setViewModalOpen(true);
    setLoadingDashboardData(true);

    try {
      let config = null;
      if (dashboard.connectionId && dashboard.dbType) {
        const connections = dbConnections[dashboard.dbType] || [];
        const connection = connections.find(conn => conn.id === dashboard.connectionId);
        if (connection) {
          config = getConnectionConfig(connection);
        }
      }

      const response = await databaseAPI.getTableData(
        dashboard.tableName,
        dashboard.columns,
        dashboard.limit || 100,
        config
      );

      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(data);
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

  // Modal açıldığında veya bağlantı değiştiğinde tabloları yükle
  useEffect(() => {
    if (showCreateModal && selectedConnectionId) {
      loadTables();
    }
  }, [showCreateModal, selectedConnectionId, dbType]);

  // Veritabanı bağlantılarını localStorage'dan yeniden yükle (modal açıldığında)
  useEffect(() => {
    if (showCreateModal) {
      const postgresqlConnections = localStorage.getItem('postgresql_connections');
      const mssqlConnections = localStorage.getItem('mssql_connections');
      
      const pgConns = postgresqlConnections ? JSON.parse(postgresqlConnections) : [];
      const mssqlConns = mssqlConnections ? JSON.parse(mssqlConnections) : [];
      
      setDbConnections({
        postgresql: pgConns.filter(conn => conn.active),
        mssql: mssqlConns.filter(conn => conn.active)
      });
    }
  }, [showCreateModal]);

  // Menü dışına tıklanınca menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.menu-button') && !event.target.closest('.menu-dropdown')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const hasDashboards = dashboards.length > 0 || folders.length > 0;
  const listSectionId = 'custom-dashboard-library';
  const mostUsedViewTypeKey = dashboardInsights.mostUsedViewType?.[0];
  const mostUsedViewTypeCount = dashboardInsights.mostUsedViewType?.[1] ?? 0;
  const mostUsedViewMeta = mostUsedViewTypeKey ? VIEW_TYPE_META[mostUsedViewTypeKey] : null;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex w-full flex-col gap-6">
          <section id={listSectionId} className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                  <Sliders className="w-6 h-6 text-white" />
              </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Chronizer
                  </h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNewFolder({ name: '', icon: 'folder', color: 'blue', description: '' });
                    setEditingFolderId(null);
                    setShowFolderModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors shadow-sm"
                >
                  <Folder className="h-5 w-5" />
                  Klasör Oluştur
                </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Dashboard Oluştur
              </button>
              </div>
            </div>

            {(folders.length > 0 || groupedDashboards.ungrouped.length > 0) ? (
              <div className="space-y-6">
                {/* Klasörler */}
                {Object.values(groupedDashboards.folderGroups).map(({ folder, dashboards: folderDashboards }) => {
                  const isExpanded = expandedFolders[folder.id];
                  const folderIcon = FOLDER_ICONS.find(icon => icon.value === folder.icon) || FOLDER_ICONS[0];
                  const folderColor = FOLDER_COLORS.find(color => color.value === folder.color) || FOLDER_COLORS[0];
                  const IconComponent = folderIcon.icon;

                  return (
                    <div key={folder.id} className="space-y-4">
                      {/* Klasör Başlığı */}
                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
                        {/* Gradient Accent Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${
                          folder.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          folder.color === 'green' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                          folder.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                          folder.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          folder.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          folder.color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                          folder.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                          folder.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-r from-gray-500 to-gray-600'
                        }`} />
                        
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {/* Chevron Button */}
                        <button
                                onClick={() => toggleFolder(folder.id)}
                                className={`mt-1 p-2 rounded-lg transition-all duration-200 ${
                                  isExpanded 
                                    ? 'bg-gray-100 text-gray-700' 
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                        </button>

                              {/* Folder Icon */}
                              <div className={`flex-shrink-0 p-3 rounded-xl shadow-sm ${
                                folder.color === 'blue' ? 'bg-blue-50' :
                                folder.color === 'green' ? 'bg-emerald-50' :
                                folder.color === 'purple' ? 'bg-purple-50' :
                                folder.color === 'orange' ? 'bg-orange-50' :
                                folder.color === 'red' ? 'bg-red-50' :
                                folder.color === 'pink' ? 'bg-pink-50' :
                                folder.color === 'indigo' ? 'bg-indigo-50' :
                                folder.color === 'yellow' ? 'bg-yellow-50' :
                                'bg-gray-50'
                              }`}>
                                <IconComponent className={`h-6 w-6 ${
                                  folder.color === 'blue' ? 'text-blue-600' :
                                  folder.color === 'green' ? 'text-emerald-600' :
                                  folder.color === 'purple' ? 'text-purple-600' :
                                  folder.color === 'orange' ? 'text-orange-600' :
                                  folder.color === 'red' ? 'text-red-600' :
                                  folder.color === 'pink' ? 'text-pink-600' :
                                  folder.color === 'indigo' ? 'text-indigo-600' :
                                  folder.color === 'yellow' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`} />
                      </div>

                              {/* Folder Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-lg font-bold text-gray-900">{folder.name}</h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    folder.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                    folder.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                                    folder.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                    folder.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                    folder.color === 'red' ? 'bg-red-100 text-red-700' :
                                    folder.color === 'pink' ? 'bg-pink-100 text-pink-700' :
                                    folder.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                                    folder.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {folderDashboards.length} dashboard
                                  </span>
                        </div>
                                {folder.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{folder.description}</p>
                                )}
                              </div>
                      </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 ml-4">
                        <button
                                onClick={() => {
                                  setSelectedFolderId(folder.id);
                                  resetForm();
                                  setShowCreateModal(true);
                                }}
                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Bu klasöre dashboard ekle"
                              >
                                <Plus className="h-5 w-5" />
                        </button>
                        <button
                                onClick={() => handleEditFolder(folder)}
                                className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                title="Klasörü düzenle"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteFolder(folder.id)}
                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Klasörü sil"
                              >
                                <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                          </div>
                        </div>
                      </div>

                      {/* Klasör İçindeki Dashboard'lar */}
                      {isExpanded && (
                        <div className="ml-4 pl-8 border-l-2 border-gray-100 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {folderDashboards.map((dashboard) => {
                            const viewMeta = VIEW_TYPE_META[dashboard.viewType] || VIEW_TYPE_META.table;
                            return renderDashboardCard(dashboard, viewMeta);
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Klasörsüz Dashboard'lar */}
                {groupedDashboards.ungrouped.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">Klasörsüz Dashboard'lar</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {groupedDashboards.ungrouped.map((dashboard) => {
                        const viewMeta = VIEW_TYPE_META[dashboard.viewType] || VIEW_TYPE_META.table;
                        return renderDashboardCard(dashboard, viewMeta);
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white px-10 py-16 text-center">
                <div className="mx-auto max-w-md space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Sliders className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Henüz dashboard oluşturmadınız</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Veritabanı tablolarınızı seçin, kolonları belirleyin ve görsel bir deneyim oluşturun. Tüm çalışmalarınız burada listelenecek.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5" />
                    İlk Dashboard'unuzu Oluşturun
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Yeni Dashboard Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-black/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col relative z-[60] animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30">
                  <Sliders className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {editingDashboardId ? 'Dashboard Düzenle' : 'Yeni Dashboard Oluştur'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    {editingDashboardId ? 'Mevcut dashboard ayarlarını güncelleyin' : 'Verilerinizi görselleştirin ve analiz edin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/50 to-gray-50/30">
              <div className="p-6 space-y-6">
                {/* Veritabanı Tipi ve Bağlantı Seçimi */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Veritabanı Tipi */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">
                      Veritabanı Tipi <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setDbType('postgresql');
                          setSelectedConnectionId(null);
                          setTables([]);
                          setSelectedTable('');
                          setColumns([]);
                          setSelectedColumns([]);
                          setNewDashboard(prev => ({ ...prev, dbType: 'postgresql', connectionId: null }));
                        }}
                        className={`group flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          dbType === 'postgresql'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20 scale-105'
                            : 'border-gray-200 bg-white/80 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:scale-102'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${dbType === 'postgresql' ? 'bg-blue-500' : 'bg-gray-200 group-hover:bg-blue-400'} transition-colors`}>
                          <Database className={`w-4 h-4 ${dbType === 'postgresql' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${dbType === 'postgresql' ? 'text-blue-900' : 'text-gray-700'}`}>
                          PostgreSQL
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setDbType('mssql');
                          setSelectedConnectionId(null);
                          setTables([]);
                          setSelectedTable('');
                          setColumns([]);
                          setSelectedColumns([]);
                          setNewDashboard(prev => ({ ...prev, dbType: 'mssql', connectionId: null }));
                        }}
                        className={`group flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          dbType === 'mssql'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20 scale-105'
                            : 'border-gray-200 bg-white/80 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:scale-102'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${dbType === 'mssql' ? 'bg-blue-500' : 'bg-gray-200 group-hover:bg-blue-400'} transition-colors`}>
                          <Database className={`w-4 h-4 ${dbType === 'mssql' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${dbType === 'mssql' ? 'text-blue-900' : 'text-gray-700'}`}>
                          MSSQL
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Veritabanı Bağlantısı */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">
                      Veritabanı Bağlantısı <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedConnectionId || ''}
                      onChange={(e) => {
                        const connId = e.target.value;
                        setSelectedConnectionId(connId);
                        setTables([]);
                        setSelectedTable('');
                        setColumns([]);
                        setSelectedColumns([]);
                        setNewDashboard(prev => ({ ...prev, connectionId: connId || null }));
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-900 appearance-none bg-white/90 backdrop-blur-sm font-medium shadow-sm hover:shadow-md hover:border-gray-300"
                    >
                      <option value="">Bağlantı seçin...</option>
                      {dbConnections[dbType]?.map((conn) => (
                        <option key={conn.id} value={conn.id}>
                          {conn.name} ({conn.host}:{conn.port}/{conn.database})
                        </option>
                      ))}
                    </select>
                    {dbConnections[dbType]?.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1.5">
                        {dbType === 'postgresql' ? 'PostgreSQL' : 'MSSQL'} bağlantısı bulunamadı. 
                        <a href={`/${dbType}`} className="underline ml-1">Bağlantı ekleyin</a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Dashboard Adı */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">
                    Dashboard Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDashboard.name}
                    onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder:text-gray-400 font-medium bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-gray-300"
                    placeholder="Örn: CPU Kullanım Analizi, Satış Raporu, Performans Metrikleri"
                    required
                  />
                </div>

                {/* Tablo Seçimi */}
                {selectedConnectionId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">
                      Tablo Seçin <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          value={selectedTable}
                          onChange={(e) => loadColumns(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-900 appearance-none bg-white/90 backdrop-blur-sm font-medium shadow-sm hover:shadow-md hover:border-gray-300"
                          disabled={loadingTables}
                        >
                          <option value="">Tabloyu seçin...</option>
                          {tables.map((table) => (
                            <option key={table} value={table}>
                              {table}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={loadTables}
                        disabled={loadingTables || !selectedConnectionId}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:hover:scale-100"
                      >
                        {loadingTables ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>Yenile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Kolonlar */}
                {columns.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-gray-900">
                        Kolonları Seçin <span className="text-red-500">*</span>
                        {selectedColumns.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            ({selectedColumns.length} seçili)
                          </span>
                        )}
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-4 border-2 border-gray-200/50 rounded-xl bg-gradient-to-br from-gray-50/50 to-white/50 backdrop-blur-sm">
                      {columns.map((column) => {
                        const isSelected = selectedColumns.includes(column.column_name);
                        return (
                          <label
                            key={column.column_name}
                            className={`group flex flex-col gap-2 p-2.5 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                                : 'bg-white/80 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md hover:scale-102'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleColumn(column.column_name)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {column.column_name}
                                </div>
                                <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                  {column.data_type}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {selectedColumns.length > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <label className="block text-xs font-bold text-gray-900 mb-3">
                          Kolon Takma İsimleri
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {selectedColumns.map((column) => (
                            <div key={column} className="flex flex-col gap-1.5">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                {column}
                              </span>
                              <input
                                type="text"
                                value={newDashboard.columnAliases[column] ?? ''}
                                onChange={(e) => handleAliasChange(column, e.target.value)}
                                placeholder="Takma isim (opsiyonel)"
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-900 placeholder:text-gray-400 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-gray-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Görünüm Tipi */}
                {selectedColumns.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-3">
                      Görünüm Tipi <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'table', label: 'Tablo', icon: Table, color: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/30' },
                        { value: 'bar', label: 'Çubuk Grafik', icon: BarChart3, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/30' },
                        { value: 'line', label: 'Çizgi Grafik', icon: LineChart, color: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/30' },
                        { value: 'pie', label: 'Pasta Grafik', icon: PieChart, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/30' }
                      ].map((type) => {
                        const isSelected = newDashboard.viewType === type.value;
                        return (
                          <label
                            key={type.value}
                            className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                              isSelected
                                ? `bg-gradient-to-br ${type.color} border-transparent text-white shadow-xl ${type.shadow} scale-105`
                                : 'bg-white/80 border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-lg hover:scale-102'
                            }`}
                          >
                            <input
                              type="radio"
                              name="viewType"
                              value={type.value}
                              checked={isSelected}
                              onChange={(e) => setNewDashboard({ ...newDashboard, viewType: e.target.value })}
                              className="sr-only"
                            />
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-blue-100'} transition-colors`}>
                              <type.icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {type.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Klasör ve Limit */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Klasör Seçimi */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">
                      Klasör (Opsiyonel)
                    </label>
                    <select
                      value={newDashboard.folderId || ''}
                      onChange={(e) => setNewDashboard({ ...newDashboard, folderId: e.target.value || null })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-900 appearance-none bg-white/90 backdrop-blur-sm font-medium shadow-sm hover:shadow-md hover:border-gray-300"
                    >
                      <option value="">Klasörsüz (Kök)</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Limit */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">
                      Kayıt Limiti
                    </label>
                    <input
                      type="number"
                      value={newDashboard.limit}
                      onChange={(e) => setNewDashboard({ ...newDashboard, limit: parseInt(e.target.value) || 100 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-900 font-medium bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-gray-300"
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-white/95 via-blue-50/80 to-indigo-50/80 backdrop-blur-xl border-t-2 border-gray-200/50 px-6 py-4 flex justify-end gap-3 z-20">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105"
              >
                İptal
              </button>
              <button
                onClick={saveDashboard}
                disabled={!newDashboard.name || !newDashboard.tableName || newDashboard.columns.length === 0 || !selectedConnectionId}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-500 disabled:cursor-not-allowed text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:hover:scale-100 disabled:shadow-none"
              >
                {editingDashboardId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Klasör Oluştur/Düzenle Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-100">
                  <Folder className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {editingFolderId ? 'Klasör Düzenle' : 'Yeni Klasör Oluştur'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingFolderId ? 'Klasör bilgilerini güncelleyin' : 'Dashboardlarınızı organize edin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolderId(null);
                  setNewFolder({ name: '', icon: 'folder', color: 'blue', description: '' });
                }}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-6">
                {/* Klasör Adı */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Klasör Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Örn: CPU Analizleri, Satış Raporları"
                    required
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Açıklama
                  </label>
                  <textarea
                    value={newFolder.description}
                    onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Klasör hakkında kısa bir açıklama (opsiyonel)"
                    rows={3}
                  />
                </div>

                {/* İkon Seçimi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    İkon
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {FOLDER_ICONS.map((icon) => {
                      const IconComponent = icon.icon;
                      const isSelected = newFolder.icon === icon.value;
                      return (
                        <button
                          key={icon.value}
                          onClick={() => setNewFolder({ ...newFolder, icon: icon.value })}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                            {icon.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Renk Seçimi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Renk
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {FOLDER_COLORS.map((color) => {
                      const isSelected = newFolder.color === color.value;
                      return (
                        <button
                          key={color.value}
                          onClick={() => setNewFolder({ ...newFolder, color: color.value })}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${color.color}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                            {color.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolderId(null);
                  setNewFolder({ name: '', icon: 'folder', color: 'blue', description: '' });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                onClick={editingFolderId ? updateFolder : createFolder}
                disabled={!newFolder.name.trim()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {editingFolderId ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Taşıma Modal */}
      {showMoveModal && moveDashboardId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Move className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Dashboard Taşı</h2>
              </div>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveDashboardId(null);
                }}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Dashboard'u hangi klasöre taşımak istersiniz?</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => moveDashboardToFolder(moveDashboardId, null)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <Folder className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Klasörsüz (Kök)</span>
                </button>
                {folders.map((folder) => {
                  const folderIcon = FOLDER_ICONS.find(icon => icon.value === folder.icon) || FOLDER_ICONS[0];
                  const folderColor = FOLDER_COLORS.find(color => color.value === folder.color) || FOLDER_COLORS[0];
                  const IconComponent = folderIcon.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => moveDashboardToFolder(moveDashboardId, folder.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg ${folderColor.color} text-white`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{folder.name}</span>
                        {folder.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{folder.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-gray-900/80 via-black/70 to-gray-900/80 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-[95vw] max-h-[95vh] flex-col overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 flex items-start justify-between z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30">
                    <LineChart className="w-5 h-5 text-white" />
              </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {selectedDashboard?.name || 'Dashboard'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-[52px]">
                  <Database className="w-4 h-4" />
                  <span className="font-medium">{selectedDashboard?.tableName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={closeViewModal}
                  className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50/30 to-white/50 px-8 py-6">
              {loadingDashboardData ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600 font-medium">Veriler yükleniyor...</p>
                  </div>
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
