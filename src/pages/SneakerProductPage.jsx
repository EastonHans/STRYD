import { useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../context/useStore.js'
import { parsePrice } from '../lib/parsePrice.js'

function AdminProductForm({ sneaker, updateSneaker, onBanner }) {
  const formId = useId()
  const [name, setName] = useState(() => sneaker.name ?? '')
  const [description, setDescription] = useState(() => sneaker.description ?? '')
  const [origin, setOrigin] = useState(() => sneaker.origin ?? '')
  const [price, setPrice] = useState(() => String(sneaker.price ?? ''))
  const [saving, setSaving] = useState(false)

  const nameId = `${formId}-name`
  const descId = `${formId}-desc`
  const originId = `${formId}-origin`
  const priceId = `${formId}-price`

  const handleSave = async (e) => {
    e.preventDefault()
    const p = parsePrice(price)
    if (!Number.isFinite(p) || p <= 0) {
      onBanner('Please enter a valid price.')
      return
    }
    setSaving(true)
    onBanner('')
    try {
      await updateSneaker(sneaker.id, {
        name: name.trim(),
        description: description.trim(),
        origin: origin.trim(),
        price: p,
      })
      onBanner('Product updated successfully.')
    } catch (err) {
      onBanner(err?.message ?? 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="admin-form admin-form--compact"
      aria-label="Edit sneaker product"
      onSubmit={handleSave}
    >
      <div className="admin-form__fields">
        <div className="field">
          <label className="field__label" htmlFor={nameId}>Sneaker Name</label>
          <input id={nameId} className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={descId}>Description</label>
          <textarea id={descId} className="input input--textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={originId}>Category</label>
          <input id={originId} className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={priceId}>Price</label>
          <input id={priceId} className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      <div className="admin-form__actions admin-form__actions--split">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export function SneakerProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sneakers, loading, error, updateSneaker, deleteSneaker } = useStore()
  const statusRef = useRef(null)

  const sneaker = sneakers.find((s) => String(s.id) === String(id))
  const [banner, setBanner] = useState('')

  const handleBanner = (msg) => {
    setBanner(msg)
    if (msg) queueMicrotask(() => statusRef.current?.focus())
  }

  if (loading && !sneaker) {
    return (
      <div className="product-page" aria-busy="true">
        <p className="muted" style={{ textAlign: 'center', paddingTop: '6rem' }}>Loading…</p>
      </div>
    )
  }

  if (error && !sneaker) {
    return (
      <div className="product-page">
        <p className="error-text" role="alert">{error}</p>
        <Link to="/shop" className="text-link">Back to shop</Link>
      </div>
    )
  }

  if (!sneaker) {
    return (
      <div className="product-page">
        <p className="muted">We could not find that style.</p>
        <Link to="/shop" className="text-link">Back to shop</Link>
      </div>
    )
  }

  const formKey = `${sneaker.id}-${sneaker.price}-${sneaker.name}`

  return (
    <div className="product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/shop" className="text-link">Shop</Link>
        <span aria-hidden="true"> / </span>
        <span>{sneaker.name}</span>
      </nav>

      <div className="product-detail">
        <header className="product-detail__header">
          <h1 className="product-detail__title">{sneaker.name}</h1>
          <p className="product-detail__lede">{sneaker.description}</p>
          <p className="product-detail__meta"><strong>Category:</strong> {sneaker.origin}</p>
          {sneaker.tag ? (
            <p className="product-detail__meta"><strong>Badge:</strong> {sneaker.tag}</p>
          ) : null}
          <p className="product-detail__meta"><strong>Price:</strong> ${Number(sneaker.price).toFixed(2)}</p>
        </header>

        <section className="admin-edit" aria-labelledby="edit-heading">
          <h2 id="edit-heading" className="admin-edit__title">Administrator edits</h2>
          

          <div
            ref={statusRef}
            tabIndex={-1}
            className={`status-banner${banner.includes('success') ? ' status-banner--ok' : ''}`}
            role="status"
          >
            {banner}
          </div>

          <AdminProductForm key={formKey} sneaker={sneaker} updateSneaker={updateSneaker} onBanner={handleBanner} />

          <div className="product-page__back">
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/shop')}>
              Back to shop
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={async () => {
                if (!window.confirm(`Delete "${sneaker.name}"?`)) return
                try {
                  await deleteSneaker(sneaker.id)
                  navigate('/shop')
                } catch (err) {
                  handleBanner(err?.message ?? 'Delete failed.')
                }
              }}
            >
              Delete style
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
