import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { Button, Modal, Card } from '../components/UI'
import { CATEGORY_GROUPS, DEFAULT_CATEGORIES, ICON_OPTIONS } from '../constants'

const getGroupLabel = (group) =>
  CATEGORY_GROUPS.find((item) => item.id === group)?.label || 'Appointments'

export const CategorySettings = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [name, setName] = useState('')
  const [group, setGroup] = useState('appointments')
  const [icon, setIcon] = useState(ICON_OPTIONS[0]?.id || 'fa-tag')
  const [error, setError] = useState('')

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  })

  const iconOptions = ICON_OPTIONS

  const openCreate = () => {
    setEditingCategory(null)
    setName('')
    setGroup('appointments')
    setIcon(iconOptions[0]?.id || 'fa-tag')
    setError('')
    setIsModalOpen(true)
  }

  const openEdit = (category) => {
    setEditingCategory(category)
    setName(category.name)
    setGroup(category.group)
    setIcon(category.icon || iconOptions[0]?.id || 'fa-tag')
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setError('')
  }

  useEffect(() => {
    if (!isModalOpen) {
      setName('')
      setGroup('appointments')
      setIcon(iconOptions[0]?.id || 'fa-tag')
      setEditingCategory(null)
      setError('')
    }
  }, [isModalOpen, iconOptions])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, group, icon }
      if (editingCategory) {
        return api.categories.update(editingCategory.id, payload)
      }
      return api.categories.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      closeModal()
    },
    onError: (err) => {
      setError(err?.message || 'Something went wrong')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a category name.')
      return
    }
    if (
      !editingCategory &&
      categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('That category already exists.')
      return
    }
    saveMutation.mutate()
  }

  const handleDelete = (category) => {
    if (!window.confirm(`Delete "${category.name}"? Existing entries will move to Personal.`)) {
      return
    }
    deleteMutation.mutate(category.id)
  }

  return (
    <div className="categories">
      <div className="categories-header">
        <div>
          <h1 className="page-title">Edit Categories</h1>
          <p className="page-subtitle">Create custom categories and choose an icon.</p>
        </div>
        <Button variant="secondary" onClick={openCreate}>
          + Add category
        </Button>
      </div>

      <Card className="categories-card">
        {categories.map((category) => (
          <div key={category.id || category.name} className="category-row">
            <div className="category-info">
              <div className="category-icon-badge">
                <i className={`fa-solid ${category.icon || 'fa-tag'}`}></i>
              </div>
              <div>
                <div className="category-name">{category.name}</div>
                <div className="category-meta">{getGroupLabel(category.group)}</div>
              </div>
            </div>
            <div className="category-actions">
              {category.locked ? (
                <span className="category-lock">Default</span>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="category-action"
                    onClick={() => openEdit(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="category-action"
                    onClick={() => handleDelete(category)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="form-input"
              placeholder="e.g. Travel"
              disabled={saveMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Section</label>
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              className="form-select"
              disabled={saveMutation.isPending}
            >
              {CATEGORY_GROUPS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-grid">
              {iconOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`icon-option${icon === option.id ? ' icon-option--selected' : ''}`}
                  onClick={() => setIcon(option.id)}
                  aria-label={option.label}
                  disabled={saveMutation.isPending}
                >
                  <i className={`fa-solid ${option.id}`}></i>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions-inline">
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
