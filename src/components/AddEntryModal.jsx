import React, { useEffect, useState } from "react";
import { Modal, Button } from "./UI";
import { DEFAULT_CATEGORIES } from "../constants";
import { EntryStatus, EntryType } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export const AddEntryModal = ({ isOpen, onClose, defaultCategory }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  });

  const categoryMatch = defaultCategory
    ? categories.find((cat) => cat.name === defaultCategory)
    : null;
  let defaultGroup = categoryMatch?.group || null;
  if (!defaultGroup) {
    if (
      defaultCategory === "General" ||
      defaultCategory === "Contract" ||
      defaultCategory === "Contracts"
    ) {
      defaultGroup = "contracts";
    } else if (defaultCategory === "Appointments") {
      defaultGroup = "appointments";
    }
  }
  const targetGroup = defaultGroup || categories[0]?.group || "appointments";
  const availableCategories = categories.filter((cat) => cat.group === targetGroup);
  const activeCategory =
    categories.find((cat) => cat.name === category) || availableCategories[0] || categories[0];
  const isContractOrInsurance = activeCategory?.group === "contracts";

  const mutation = useMutation({
    mutationFn: async () => {
      const type = activeCategory?.entryType || EntryType.PERSONAL;
      const entry = await api.entries.create({
        title,
        category: category || activeCategory?.name || "General",
        status: EntryStatus.ACTIVE,
        type,
        expirationDate: isContractOrInsurance ? expirationDate || undefined : undefined,
        startAt: startAt || undefined,
        companyName: companyName.trim() || undefined,
        portalUrl: portalUrl.trim() || undefined,
        notes,
      });
      if (file) {
        await api.documents.create(entry.id, file.name);
      }
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onClose();
      setTitle("");
      setCategory("");
      setExpirationDate("");
      setStartAt("");
      setCompanyName("");
      setPortalUrl("");
      setNotes("");
      setFile(null);
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setCategory("");
    setExpirationDate("");
    setStartAt("");
    setCompanyName("");
    setPortalUrl("");
    setNotes("");
    setFile(null);
  }, [isOpen]);

  useEffect(() => {
    if (!availableCategories.length) return;
    if (category && !availableCategories.some((cat) => cat.name === category)) {
      setCategory(availableCategories[0]?.name || "");
    }
  }, [availableCategories, category]);

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate();
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files ? event.target.files[0] : null;
    setFile(nextFile);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Entry">
      <form onSubmit={handleSubmit} className="form form--entry">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="form-input"
            placeholder="e.g. Health Insurance"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="form-select"
          >
            <option value="" disabled>
              Select category
            </option>
            {availableCategories.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {isContractOrInsurance ? "Start Date" : "Start Date & Time"}
          </label>
          <input
            type={isContractOrInsurance ? "date" : "datetime-local"}
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className="form-input"
          />
        </div>

        {isContractOrInsurance && (
          <div className="form-group">
            <label className="form-label">Expiration Date</label>
            <input
              type="date"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              className="form-input"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="form-input"
            placeholder="e.g. Vodafone"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Customer Portal URL</label>
          <input
            type="url"
            value={portalUrl}
            onChange={(event) => setPortalUrl(event.target.value)}
            className="form-input"
            placeholder="https://portal.company.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="form-textarea"
            placeholder="Additional details..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="entry-document">
            Upload Document
          </label>
          <div className="form-file-row">
            <input
              id="entry-document"
              type="file"
              onChange={handleFileChange}
              className="form-file-input"
            />
            <label className="form-file-button" htmlFor="entry-document">
              Choose file
            </label>
            <span className="form-file-name">
              {file ? file.name : "No file selected"}
            </span>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" className="btn-block" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
