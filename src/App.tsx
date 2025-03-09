import React, { useState, useEffect } from 'react';
import './App.scss';

interface Row {
  id: number;
  name: string;
  salary: number;
  equipmentCosts: number;
  overheads: number;
  estimatedProfit: number;
  parentId?: number | null;
  children?: Row[];
  editing?: boolean;
  isNew?: boolean;
}

interface RawRow {
  id: number;
  rowName: string;
  salary: number;
  equipmentCosts: number;
  overheads: number;
  estimatedProfit: number;
  parentId?: number | null;
  child?: RawRow[];
}

interface ApiResponse {
  changed?: RawRow[];
  current?: RawRow;
  rows?: RawRow[];
}

const mapRawRowToRow = (rawRow: RawRow): Row => ({
  id: rawRow.id,
  name: rawRow.rowName,
  salary: rawRow.salary,
  equipmentCosts: rawRow.equipmentCosts,
  overheads: rawRow.overheads,
  estimatedProfit: rawRow.estimatedProfit,
  parentId: rawRow.parentId,
  children: rawRow.child ? rawRow.child.map(mapRawRowToRow) : undefined,
  editing: false,
  isNew: false,
});

const RowItem: React.FC<{
  row: Row;
  createRow: (parentId: number | null) => void;
  updateRow: (rowId: number, updatedRow: Row) => void;
  deleteRow: (rowId: number) => void;
  level?: number;
}> = ({ row, createRow, updateRow, deleteRow, level = 0 }) => {
  const [isEditing, setIsEditing] = useState(row.editing || row.isNew || false);
  const [editedRow, setEditedRow] = useState(row);

  useEffect(() => {
    setEditedRow(row);
    setIsEditing(row.editing || row.isNew || false);
  }, [row]);

  const handleDoubleClick = () => {
    if (!row.isNew) setIsEditing(true);
  };

  const handleChange = (field: keyof Row, value: string | number) => {
    const updatedValue = typeof value === "string" ? Number(value) : value;
    setEditedRow((prev) => ({ ...prev, [field]: updatedValue }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isEditing) {
      setIsEditing(false);
      updateRow(row.id, editedRow);
    }
  };

  const canCreateChild = !isEditing && !row.isNew;

  return (
    <div className={`tree-node level-${level}`}>
      <div
        className="row"
        style={{
          display: "grid",
          gridTemplateColumns: "50px 733px 176px 176px 176px 176px",
          gap: "24px",
        }}
      >
        <span className="level">
          {row.children && row.children.length > 0 ? (
            <img
              src="./img/new_file.png"
              alt="folder"
              className="folder-icon"
              onClick={() => createRow(row.id)}
              style={{ cursor: "url('./img/HandIndex.png'), pointer" }}
            />
          ) : (
            ""
          )}
        </span>
        {isEditing ? (
          <>
            <input
              className="cell cell-name cell-input"
              value={editedRow.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <input
              type="number"
              className="cell cell-salary cell-input"
              value={editedRow.salary}
              onChange={(e) => handleChange("salary", Number(e.target.value))}
              onKeyPress={handleKeyPress}
            />
            <input
              type="number"
              className="cell cell-equipment cell-input"
              value={editedRow.equipmentCosts}
              onChange={(e) =>
                handleChange("equipmentCosts", Number(e.target.value))
              }
              onKeyPress={handleKeyPress}
            />
            <input
              type="number"
              className="cell cell-overheads cell-input"
              value={editedRow.overheads}
              onChange={(e) => handleChange("overheads", Number(e.target.value))}
              onKeyPress={handleKeyPress}
            />
            <input
              type="number"
              className="cell cell-profit cell-input"
              value={editedRow.estimatedProfit}
              onChange={(e) =>
                handleChange("estimatedProfit", Number(e.target.value))
              }
              onKeyPress={handleKeyPress}
            />
          </>
        ) : (
          <>
            <span className="cell cell-name" onDoubleClick={handleDoubleClick}>
              {row.name || "Без названия"}
            </span>
            <span className="cell cell-salary">{row.salary}</span>
            <span className="cell cell-equipment">{row.equipmentCosts}</span>
            <span className="cell cell-overheads">{row.overheads}</span>
            <span className="cell cell-profit">{row.estimatedProfit}</span>
          </>
        )}
        <div className="actions">
          {canCreateChild && (
            <button
              className="action-btn add-btn"
              onClick={() => createRow(row.id)}
            >
              +
            </button>
          )}
          {!row.isNew && (
            <button
              className="action-btn delete-btn"
              onClick={() => deleteRow(row.id)}
            >
              <img src="./img/delete.png" alt="delete" className="delete-icon" />
            </button>
          )}
        </div>
      </div>
      {row.children && row.children.length > 0 && (
        <div className="children">
          {row.children.map((child, index) => (
            <div
              key={child.id}
              className={`child-row ${index === row.children!.length - 1 ? "last-child" : ""
                }`}
            >
              <RowItem
                row={child}
                createRow={createRow}
                updateRow={updateRow}
                deleteRow={deleteRow}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [activeNavItem, setActiveNavItem] = useState<string>("СМР");
  const eID = 148793;

  useEffect(() => {
    if (eID) {
      fetchRows(eID.toString());
    }
  }, []); // Загрузка данных при первом входе

  useEffect(() => {
    if (rows.length === 0) {
      createRow(null); // Создание пустой строки, если данных нет
    }
  }, [rows]);

  const fetchRows = async (eID: string) => {
    try {
      const response = await fetch(
        `http://185.244.172.108:8081/v1/outlay-rows/entity/${eID}/row/list`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setRows(data.map(mapRawRowToRow));
      } else if (data.rows && Array.isArray(data.rows)) {
        setRows(data.rows.map(mapRawRowToRow));
      } else {
        console.error("Unexpected data structure:", data);
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching rows:", error);
      setRows([]);
    }
  };

  const createRow = (parentId: number | null) => {
    if (!eID) return;

    const newRow: Row = {
      id: Date.now(), // Временный ID
      name: "",
      salary: 0,
      equipmentCosts: 0,
      overheads: 0,
      estimatedProfit: 0,
      parentId,
      editing: true,
      isNew: true,
    };

    const addRowToTree = (rows: Row[], targetParentId: number | null): Row[] => {
      if (!targetParentId) {
        return [...rows, newRow];
      }
      return rows.map((row) => {
        if (row.id === targetParentId) {
          return {
            ...row,
            children: [...(row.children || []), newRow],
          };
        }
        if (row.children) {
          return { ...row, children: addRowToTree(row.children, targetParentId) };
        }
        return row;
      });
    };

    setRows((prevRows) => addRowToTree(prevRows, parentId));
  };

  const updateRow = async (rowId: number, updatedRow: Row) => {
    if (!eID) return;

    const fullRequestBody = {
      rowName: updatedRow.name,
      salary: updatedRow.salary,
      equipmentCosts: updatedRow.equipmentCosts,
      overheads: updatedRow.overheads,
      estimatedProfit: updatedRow.estimatedProfit,
      machineOperatorSalary: 0,
      mainCosts: 0,
      materials: 0,
      mimExploitation: 0,
      supportCosts: 0,
    };

    try {
      if (updatedRow.isNew) {
        const response = await fetch(
          `http://185.244.172.108:8081/v1/outlay-rows/entity/${eID}/row/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...fullRequestBody,
              parentId: updatedRow.parentId || null,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to create row");
        const data: ApiResponse = await response.json();
        if (data.current) {
          const createdRow = mapRawRowToRow(data.current);
          setRows((prevRows) =>
            updateRowInTree(prevRows, rowId, { ...createdRow, isNew: false })
          );
        }
        if (data.changed && data.changed.length > 0) {
          updateChangedRows(data.changed);
        }
      } else {
        const response = await fetch(
          `http://185.244.172.108:8081/v1/outlay-rows/entity/${eID}/row/${rowId}/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullRequestBody),
          }
        );
        if (!response.ok) throw new Error("Failed to update row");
        const data: ApiResponse = await response.json();
        if (data.changed && data.changed.length > 0) {
          updateChangedRows(data.changed);
        }
      }
    } catch (error) {
      console.error("Error updating row:", error);
      if (updatedRow.isNew) {
        setRows((prevRows) => removeRowFromTree(prevRows, rowId));
      }
    }
  };

  const deleteRow = async (rowId: number) => {
    if (!eID) return;
    try {
      const response = await fetch(
        `http://185.244.172.108:8081/v1/outlay-rows/entity/${eID}/row/${rowId}/delete`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete row");
      const data: ApiResponse = await response.json();
      if (data.changed && data.changed.length > 0) {
        updateChangedRows(data.changed);
        setRows((prevRows) => removeRowFromTree(prevRows, rowId));
      } else {
        setRows((prevRows) => removeRowFromTree(prevRows, rowId));
      }
    } catch (error) {
      console.error("Error deleting row:", error);
    }
  };

  const updateRowInTree = (rows: Row[], rowId: number, updatedRow: Row): Row[] =>
    rows.map((r) =>
      r.id === rowId
        ? updatedRow
        : r.children
          ? { ...r, children: updateRowInTree(r.children, rowId, updatedRow) }
          : r
    );

  const removeRowFromTree = (rows: Row[], rowId: number): Row[] =>
    rows
      .filter((r) => r.id !== rowId)
      .map((r) =>
        r.children ? { ...r, children: removeRowFromTree(r.children, rowId) } : r
      );

  const updateChangedRows = (changedRows: RawRow[]) => {
    setRows((prevRows) => {
      const updateRowInTree = (rows: Row[]): Row[] =>
        rows.map((r) => {
          const changedRow = changedRows.find((cr) => cr.id === r.id);
          if (changedRow) {
            return { ...mapRawRowToRow(changedRow), editing: false };
          }
          if (r.children) {
            return { ...r, children: updateRowInTree(r.children) };
          }
          return r;
        });
      return updateRowInTree(prevRows);
    });
  };

  const navItems = [
    "По проекту",
    "Объекты",
    "РД",
    "МТО",
    "СМР",
    "График",
    "МиМ",
    "Рабочие",
    "Капвложения",
    "Бюджет",
    "Финансирование",
    "Панорамы",
    "Камеры",
    "Поручения",
    "Контрагенты",
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="cube">
          <img src="./img/cube.png" alt="cube" />
        </div>
        <div className="arrow">
          <img src="./img/arrow.png" alt="arrow" />
        </div>
        <div className="watch">Просмотр</div>
        <div className="control">Управление</div>
      </header>

      <nav className="horizontal-nav">
        <div className="header-menu">
          <div className="project-name">
            Название проекта
            <span id="up">
              <img src="./img/up.png" alt="up" />
            </span>
            <p className="abbreviation">Аббревиатура</p>
          </div>
          <div className="cmp">Строительно-монтажные работы</div>
        </div>
      </nav>

      <div className="main-content">
        <aside className="sidebar">
          {navItems.map((item) => (
            <div
              key={item}
              className={`sidebar-item ${activeNavItem === item ? "active" : ""}`}
              onClick={() => setActiveNavItem(item)}
            >
              <img src="./img/restangle.png" alt="restangle" />
              {item}
            </div>
          ))}
        </aside>
        <main className="table">
          <div className="table-header table-grid">
            <span className="header-cell header-level">Уровень</span>
            <span className="header-cell header-name">Наименование работы</span>
            <span className="header-cell header-salary">Основная з/п</span>
            <span className="header-cell header-equipment">Оборудование</span>
            <span className="header-cell header-overheads">Накладные расходы</span>
            <span className="header-cell header-profit">Сметная прибыль</span>
          </div>
          {rows.map((row) => (
            <RowItem
              key={row.id}
              row={row}
              createRow={createRow}
              updateRow={updateRow}
              deleteRow={deleteRow}
              level={0}
            />
          ))}
        </main>
      </div>
    </div>
  );
};

export default App;