import React, { useEffect, useState } from "react";
import { Modal, Button } from "./UI";
import { CATEGORIES, CATEGORY_MAP } from "../constants";
import { EntryStatus, EntryType } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export const AddEntryModal = ({ isOpen, onClose, defaultCategory }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory || "Contracts");
  const [expirationDate, setExpirationDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const queryClient = useQueryClient();

  const isContractOrInsurance = category === "Contracts";

  const mutation = useMutation({
    mutationFn: async () => {
      const type = CATEGORY_MAP[category] || EntryType.PERSONAL;
      const entry = await api.entries.create({
        title,
        category,
        status: EntryStatus.ACTIVE,
        type,
        expirationDate: isContractOrInsurance ? expirationDate || undefined : undefined,
        startAt: startAt || undefined,
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
      setCategory(defaultCategory || "Contracts");
      setExpirationDate("");
      setStartAt("");
      setNotes("");
      setFile(null);
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setCategory(defaultCategory || "Contracts");
    setExpirationDate("");
    setStartAt("");
    setNotes("");
    setFile(null);
  }, [isOpen, defaultCategory]);

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Entry">
      <form onSubmit={handleSubmit} className="form">
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
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
          <label className="form-label">Upload Document</label>
          <input
            type="file"
            onChange={(event) =>
              setFile(event.target.files ? event.target.files[0] : null)
            }
            className="form-file"
          />
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
