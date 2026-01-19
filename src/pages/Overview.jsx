import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Card, Button, Modal } from "../components/UI";
import { DEFAULT_CATEGORIES, getCategoryIcon } from "../constants";
import { EntryType, EntryStatus } from "../types";
import { AddEntryModal } from "../components/AddEntryModal";
import { EntryDetailsModal } from "../components/EntryDetailsModal";
import { formatDate, formatDateTime } from "../utils/dateFormat";

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("General");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showContractArchive, setShowContractArchive] = useState(false);
  const [showAppointmentArchive, setShowAppointmentArchive] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [dismissedDeadlineIds, setDismissedDeadlineIds] = useState([]);
  const [suppressedDeadlineIds, setSuppressedDeadlineIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("lifeAdmin.deadlinePopupDismissedIds");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const deadlineSuppressKey = "lifeAdmin.deadlinePopupDismissedIds";
  const deadlinePopupEnabledKey = "lifeAdmin.notifications.deadlinePopupEnabled";
  const deadlinePopupEnabled =
    typeof window !== "undefined"
      ? window.localStorage.getItem(deadlinePopupEnabledKey) !== "false"
      : true;

  const formatPortalHref = (value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };
  const dataUrlToObjectUrl = (dataUrl) => {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const header = parts[0];
    const base64 = parts[1];
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    try {
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch {
      return null;
    }
  };
  const openDocument = (doc) => {
    if (!doc) return;
    if (doc.fileUrl) {
      if (doc.fileUrl.startsWith("data:")) {
        const objectUrl = dataUrlToObjectUrl(doc.fileUrl);
        if (objectUrl) {
          const newWindow = window.open(objectUrl, "_blank");
          if (newWindow) {
            newWindow.opener = null;
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            return;
          }
          URL.revokeObjectURL(objectUrl);
        }
      } else {
        window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }
    }
    const fallbackWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!fallbackWindow) return;
    fallbackWindow.document.title = doc.filename || "Document";
    const body = fallbackWindow.document.body;
    body.style.fontFamily = "Arial, sans-serif";
    body.style.padding = "24px";
    const title = fallbackWindow.document.createElement("h2");
    title.textContent = doc.filename || "Document";
    const message = fallbackWindow.document.createElement("p");
    message.textContent =
      "This file was uploaded before previews were enabled. Please re-upload it to open.";
    body.appendChild(title);
    body.appendChild(message);
  };

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["entries", selectedCategories],
    queryFn: () => api.entries.list({ category: selectedCategories }),
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ["entries", "all"],
    queryFn: () => api.entries.list(),
  });

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.documents.list(),
  });

  const recentDocuments = documents.slice(0, 5);

  const contractCategories = categories.filter(
    (category) => category.group === "contracts"
  );
  const appointmentCategories = categories.filter(
    (category) => category.group !== "contracts"
  );

  const getEntryGroup = (entry) => {
    const category = categories.find((item) => item.name === entry.category);
    if (category?.group) return category.group;
    if ([EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type))
      return "contracts";
    if (
      [
        EntryType.APPOINTMENT,
        EntryType.EVENT,
        EntryType.HEALTH,
        EntryType.FRIEND,
        EntryType.WORK,
      ].includes(entry.type)
    ) {
      return "appointments";
    }
    return "appointments";
  };

  const activeContracts = entries.filter(
    (entry) =>
      getEntryGroup(entry) === "contracts" &&
      entry.status === EntryStatus.ACTIVE
  ).length;

  const weeksFromNow = new Date();
  weeksFromNow.setDate(weeksFromNow.getDate() + 28);
  const deadlineEntries = entries.filter((entry) => {
    if (getEntryGroup(entry) !== "contracts") return false;
    if (entry.status === EntryStatus.DONE) return false;
    if (!entry.expirationDate) return false;
    const exp = new Date(entry.expirationDate);
    return exp <= weeksFromNow && exp >= new Date();
  });
  const deadlineApproaching = deadlineEntries.length;

  const deadlinePopupEntries = allEntries.filter((entry) => {
    if (getEntryGroup(entry) !== "contracts") return false;
    if (entry.status === EntryStatus.DONE) return false;
    if (!entry.expirationDate) return false;
    const exp = new Date(entry.expirationDate);
    return exp <= weeksFromNow && exp >= new Date();
  });
  const deadlinePopupCount = deadlinePopupEntries.length;

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const upcomingAppointmentsCount = entries.filter((entry) => {
    if (getEntryGroup(entry) !== "appointments") return false;
    if (!entry.startAt) return false;
    const start = new Date(entry.startAt);
    return start <= sevenDaysFromNow && start >= new Date();
  }).length;

  const contractEntries = entries.filter(
    (entry) => getEntryGroup(entry) === "contracts"
  );

  const appointmentEntries = entries.filter(
    (entry) => getEntryGroup(entry) === "appointments"
  );

  const activeContractEntries = contractEntries.filter(
    (entry) => entry.status !== EntryStatus.DONE
  );
  const archivedContractEntries = contractEntries.filter(
    (entry) => entry.status === EntryStatus.DONE
  );
  const activeAppointmentEntries = appointmentEntries.filter(
    (entry) => entry.status !== EntryStatus.DONE
  );
  const archivedAppointmentEntries = appointmentEntries.filter(
    (entry) => entry.status === EntryStatus.DONE
  );

  useEffect(() => {
    const currentIds = deadlinePopupEntries.map((entry) => entry.id);
    const blockedIds = new Set([
      ...suppressedDeadlineIds,
      ...dismissedDeadlineIds,
    ]);
    const hasNewDeadline = currentIds.some((id) => !blockedIds.has(id));

    if (deadlinePopupCount === 0) {
      setShowDeadlineModal(false);
      setDismissedDeadlineIds([]);
      if (suppressedDeadlineIds.length > 0 && typeof window !== "undefined") {
        window.localStorage.removeItem(deadlineSuppressKey);
      }
      if (suppressedDeadlineIds.length > 0) {
        setSuppressedDeadlineIds([]);
      }
      return;
    }
    if (!deadlinePopupEnabled) return;
    if (!hasNewDeadline) return;
    if (isModalOpen || selectedEntry) return;
    setShowDeadlineModal(true);
  }, [
    deadlinePopupCount,
    deadlinePopupEntries,
    deadlinePopupEnabled,
    suppressedDeadlineIds,
    dismissedDeadlineIds,
    isModalOpen,
    selectedEntry,
    deadlineSuppressKey,
  ]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const EntryRow = ({ entry }) => {
    const isContract = getEntryGroup(entry) === "contracts";
    const isDue = isContract && entry.status === EntryStatus.DUE;
    const hasDocument = documents.some((doc) => doc.entryId === entry.id);
    const extras = [];
    if (entry.companyName) {
      extras.push({ type: "text", value: entry.companyName });
    }
    if (entry.portalUrl) {
      extras.push({ type: "link", value: entry.portalUrl });
    }
    return (
      <div
        className={`entry-row${isDue ? " entry-row--due" : ""}`}
        onClick={() => setSelectedEntry(entry)}
      >
        <div className="entry-main">
          <h4 className="entry-title">{entry.title}</h4>
          <div className="entry-meta">
            <div>
              <span className="category-inline">
                <i
                  className={`fa-solid ${getCategoryIcon(
                    categories,
                    entry.category
                  )} category-icon`}
                ></i>
                {entry.category}
              </span>{" "}
              •{" "}
              <span
                className={`entry-status${isDue ? " entry-status--due" : ""}`}
              >
                {entry.status}
              </span>
              {entry.startAt && (
                <span className="entry-start">
                  {isContract
                    ? ` • Start ${formatDate(entry.startAt)}`
                    : ` • ${formatDateTime(entry.startAt)}`}
                </span>
              )}
              {extras.length > 0 && (
                <span className="entry-extra">
                  {" • "}
                  {extras.map((item, index) => (
                    <React.Fragment key={`${item.type}-${item.value}`}>
                      {index > 0 && (
                        <span className="entry-extra-sep"> • </span>
                      )}
                      {item.type === "link" ? (
                        <a
                          className="entry-link"
                          href={formatPortalHref(item.value)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="entry-extra-text">{item.value}</span>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              )}
              {hasDocument && (
                <span className="entry-doc">
                  <span className="entry-doc-sep">•</span>
                  <i className="fa-solid fa-paperclip entry-doc-icon"></i>
                  <span className="entry-doc-text">Document attached</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="entry-right">
          {entry.expirationDate ? (
            <span className="exp-badge">
              Exp {formatDate(entry.expirationDate)}
            </span>
          ) : (
            <span />
          )}
          <i className="fa-solid fa-chevron-right entry-chevron"></i>
        </div>
      </div>
    );
  };

  const ArchiveRow = ({ entry }) => (
    <div className="archive-row" onClick={() => setSelectedEntry(entry)}>
      <span className="archive-title">{entry.title}</span>
      <span className="archive-date">
        {entry.expirationDate
          ? formatDate(entry.expirationDate)
          : entry.startAt
          ? formatDate(entry.startAt)
          : "—"}
      </span>
    </div>
  );

  return (
    <div className="overview">
      <div className="overview-stats">
        <Card className="stat-card">
          <span className="stat-value">{activeContracts}</span>
          <span className="stat-label">
            Contracts without upcoming deadline
          </span>
        </Card>
        <Card className="stat-card stat-card--warning">
          <span className="stat-value stat-value--warning">
            {deadlineApproaching}
          </span>
          <span className="stat-label stat-label--warning">
            Deadline Approaching
          </span>
        </Card>
        <Card className="stat-card">
          <span className="stat-value">{upcomingAppointmentsCount}</span>
          <span className="stat-label">Upcoming Appointments</span>
        </Card>
      </div>

      <div className="overview-grid">
        <div className="overview-main">
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Contracts</h2>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalCategory("General");
                  setIsModalOpen(true);
                }}
              >
                + Add entry
              </Button>
            </div>
            <div className="entry-list">
              {entriesLoading ? (
                <div className="list-state">Loading...</div>
              ) : activeContractEntries.length === 0 ? (
                <div className="list-state list-state--muted">
                  No active contracts.
                </div>
              ) : (
                <div className="list-rows">
                  {activeContractEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedContractEntries.length > 0 && (
                <div className="archive-block">
                  <button
                    className="archive-toggle"
                    onClick={() => setShowContractArchive((prev) => !prev)}
                  >
                    <span className="archive-toggle-text">
                      Archive ({archivedContractEntries.length})
                    </span>
                    <i
                      className={`fa-solid fa-chevron-${
                        showContractArchive ? "up" : "down"
                      }`}
                    ></i>
                  </button>
                  {showContractArchive && (
                    <div className="archive-list">
                      {archivedContractEntries.map((entry) => (
                        <ArchiveRow key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Appointments & Events</h2>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalCategory("Appointments");
                  setIsModalOpen(true);
                }}
              >
                + Add entry
              </Button>
            </div>
            <div className="entry-list">
              {entriesLoading ? (
                <div className="list-state">Loading...</div>
              ) : activeAppointmentEntries.length === 0 ? (
                <div className="list-state list-state--muted">
                  No upcoming appointments or events.
                </div>
              ) : (
                <div className="list-rows">
                  {activeAppointmentEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedAppointmentEntries.length > 0 && (
                <div className="archive-block">
                  <button
                    className="archive-toggle"
                    onClick={() => setShowAppointmentArchive((prev) => !prev)}
                  >
                    <span className="archive-toggle-text">
                      Archive ({archivedAppointmentEntries.length})
                    </span>
                    <i
                      className={`fa-solid fa-chevron-${
                        showAppointmentArchive ? "up" : "down"
                      }`}
                    ></i>
                  </button>
                  {showAppointmentArchive && (
                    <div className="archive-list">
                      {archivedAppointmentEntries.map((entry) => (
                        <ArchiveRow key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overview-side">
          <Card>
            <div className="filter-header">
              <h3 className="card-title">Filter</h3>
              <button
                className="filter-clear"
                type="button"
                onClick={() => setSelectedCategories([])}
                disabled={selectedCategories.length === 0}
              >
                Clear all
              </button>
            </div>
            <div className="filter-sections">
              <div className="filter-section">
                <div className="filter-section-title">Contract</div>
                <div className="filter-list">
                  {contractCategories.map((cat) => (
                    <label key={cat.id || cat.name} className="filter-item">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)}
                      />
                      <i
                        className={`fa-solid ${getCategoryIcon(
                          categories,
                          cat.name
                        )} filter-icon`}
                      ></i>
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <div className="filter-section-title">Appointments</div>
                <div className="filter-list">
                  {appointmentCategories.map((cat) => (
                    <label key={cat.id || cat.name} className="filter-item">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)}
                      />
                      <i
                        className={`fa-solid ${getCategoryIcon(
                          categories,
                          cat.name
                        )} filter-icon`}
                      ></i>
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="card-title">Last Files</h3>
            <div className="doc-list">
              {recentDocuments.length === 0 ? (
                <p className="empty-text">No documents uploaded.</p>
              ) : (
                recentDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    className="doc-item"
                    href={doc.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      event.preventDefault();
                      openDocument(doc);
                    }}
                  >
                    <div className="doc-icon">
                      <i className="fa-solid fa-file-pdf"></i>
                    </div>
                    <span className="doc-name">{doc.filename}</span>
                  </a>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCategory={modalCategory}
      />
      <EntryDetailsModal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
      <Modal
        isOpen={showDeadlineModal}
        onClose={() => {
          setShowDeadlineModal(false);
          setDismissedDeadlineIds(deadlinePopupEntries.map((entry) => entry.id));
        }}
        title="Upcoming deadline"
      >
        <p className="deadline-note">
          You have {deadlinePopupCount} contract
          {deadlinePopupCount === 1 ? "" : "s"} expiring within the next weeks.
        </p>
        <div className="deadline-list">
          {deadlinePopupEntries.map((entry) => (
            <div key={entry.id} className="deadline-item">
              <div className="deadline-title">{entry.title}</div>
              <div className="deadline-date">
                Exp {formatDate(entry.expirationDate)}
              </div>
            </div>
          ))}
        </div>
        <div className="deadline-actions">
          <Button
            variant="ghost"
            onClick={() => {
              const ids = deadlinePopupEntries.map((entry) => entry.id);
              setSuppressedDeadlineIds(ids);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  deadlineSuppressKey,
                  JSON.stringify(ids)
                );
              }
              setShowDeadlineModal(false);
            }}
          >
            Don't show again
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeadlineModal(false);
              setDismissedDeadlineIds(deadlinePopupEntries.map((entry) => entry.id));
            }}
          >
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
};
