import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TableInfo, QueryResult } from '../types/Database';
import '../styles/database-browser.css';

interface DatabaseBrowserProps {
  isDarkMode: boolean;
}

export function DatabaseBrowser({ isDarkMode }: DatabaseBrowserProps) {
  const [dbPath, setDbPath] = useState('tasks.db');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const rowsPerPage = 50;

  useEffect(() => {
    if (dbPath) {
      loadTables();
    }
  }, [dbPath]);

  useEffect(() => {
    if (selectedTable && dbPath) {
      loadTableData();
    }
  }, [selectedTable, currentPage, dbPath]);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const tablesData = await invoke<TableInfo[]>('list_database_tables', { dbPath });
      setTables(tablesData);
      setSelectedTable(null);
      setTableData(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<QueryResult>('get_table_data', {
        dbPath,
        table: selectedTable,
        limit: rowsPerPage,
        offset: currentPage * rowsPerPage,
      });
      setTableData(data);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load table data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await invoke<QueryResult>('execute_database_query', {
        dbPath,
        query: query.trim(),
      });
      setQueryResult(result);
      setSelectedTable(null);
      setTableData(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to execute query:', err);
      setQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPages = () => {
    if (!tableData || !selectedTable) return 0;
    const table = tables.find(t => t.name === selectedTable);
    if (!table) return 0;
    return Math.ceil(table.rowCount / rowsPerPage);
  };

  return (
    <div className={`database-browser ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>Database Browser</h2>
      </div>

      <div className="db-controls">
        <div className="db-path-input">
          <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Database Path</label>
          <input
            type="text"
            value={dbPath}
            onChange={(e) => setDbPath(e.target.value)}
            placeholder="tasks.db or /path/to/database.db"
            className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
          />
          <button
            onClick={loadTables}
            className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
          >
            Load
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <div className="error-text">
              <div className="error-title">Error</div>
              <div className="error-description">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="db-content">
        <div className="db-sidebar">
          <h3 className={`sidebar-title ${isDarkMode ? 'dark' : 'light'}`}>Tables</h3>
          {loading && tables.length === 0 ? (
            <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading tables...</div>
          ) : tables.length === 0 ? (
            <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>No tables found</div>
          ) : (
            <div className="tables-list">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => {
                    setSelectedTable(table.name);
                    setCurrentPage(0);
                    setQueryResult(null);
                  }}
                  className={`table-item ${selectedTable === table.name ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
                >
                  <span className="table-name">{table.name}</span>
                  <span className={`table-count ${isDarkMode ? 'dark' : 'light'}`}>
                    {table.rowCount} rows
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="db-main">
          <div className="query-section">
            <h3 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>Custom Query</h3>
            <div className="query-input-group">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM tasks LIMIT 10"
                className={`query-input ${isDarkMode ? 'dark' : 'light'}`}
                rows={3}
              />
              <button
                onClick={handleExecuteQuery}
                className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
                disabled={!query.trim()}
              >
                Execute Query
              </button>
            </div>
          </div>

          {(tableData || queryResult) && (
            <div className="data-viewer">
              <h3 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>
                {queryResult ? 'Query Results' : `${selectedTable} Data`}
              </h3>
              
              {queryResult && (
                <div className="query-info">
                  <span className={`info-text ${isDarkMode ? 'dark' : 'light'}`}>
                    {queryResult.rowCount} row(s) returned
                  </span>
                </div>
              )}

              {!queryResult && selectedTable && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className={`btn-secondary ${isDarkMode ? 'dark' : 'light'}`}
                  >
                    Previous
                  </button>
                  <span className={`page-info ${isDarkMode ? 'dark' : 'light'}`}>
                    Page {currentPage + 1} of {getTotalPages()}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= getTotalPages() - 1}
                    className={`btn-secondary ${isDarkMode ? 'dark' : 'light'}`}
                  >
                    Next
                  </button>
                </div>
              )}

              {loading ? (
                <div className="loading-container">
                  <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading data...</div>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className={`data-table ${isDarkMode ? 'dark' : 'light'}`}>
                    <thead>
                      <tr>
                        {(queryResult || tableData)?.columns.map((col) => (
                          <th key={col} className={`table-header ${isDarkMode ? 'dark' : 'light'}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(queryResult || tableData)?.rows.map((row, idx) => (
                        <tr key={idx} className={`table-row ${isDarkMode ? 'dark' : 'light'}`}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className={`table-cell ${isDarkMode ? 'dark' : 'light'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
