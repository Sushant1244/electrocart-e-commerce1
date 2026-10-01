import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveImageSrc } from '../utils/resolveImage';

export default function Checkout() {
	const navigate = useNavigate();
	const [address, setAddress] = React.useState(() => {
		try { return JSON.parse(localStorage.getItem('shippingAddress') || 'null'); } catch (e) { return null; }
	});
	const [cart, setCart] = React.useState(() => {
		try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
	});
	const [editing, setEditing] = React.useState(!address);
	const [form, setForm] = React.useState(() => ({
		fullName: address?.fullName || '',
		line1: address?.line1 || '',
		line2: address?.line2 || '',
		city: address?.city || '',
		state: address?.state || '',
		postalCode: address?.postalCode || '',
		country: address?.country || ''
	}));

	React.useEffect(() => {
		const onStorage = (e) => {
			if (e.key === 'shippingAddress') {
				try { setAddress(JSON.parse(e.newValue)); } catch (err) { setAddress(null); }
			}
			if (e.key === 'cart') {
				try { setCart(JSON.parse(e.newValue || '[]')); } catch (err) { setCart([]); }
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	const save = (e) => {
		e?.preventDefault();
		const newAddr = { ...form };
		try { localStorage.setItem('shippingAddress', JSON.stringify(newAddr)); } catch (err) {}
		setAddress(newAddr);
		setEditing(false);
	};

	const proceed = () => {
		navigate('/payment');
	};

	return (
		<div className="container page">
			<h1>Checkout</h1>
			<div className="checkout-section">
				<h2>Shipping Address</h2>
				{address && !editing ? (
					<div className="address-display">
						<p><strong>{address.fullName}</strong></p>
						<p>{address.line1}{address.line2 ? ', ' + address.line2 : ''}</p>
						<p>{address.city}{address.state ? ', ' + address.state : ''} {address.postalCode}</p>
						<p>{address.country}</p>
						<div className="address-actions">
							<button className="btn" onClick={() => setEditing(true)}>Edit</button>
							<button className="btn btn-primary" onClick={proceed}>Proceed to Payment</button>
						</div>
					</div>
				) : (
					<form className="address-form" onSubmit={save}>
						<div>
							<label>Full name</label>
							<input value={form.fullName} onChange={(e) => setForm(f => ({...f, fullName: e.target.value}))} required />
						</div>
						<div>
							<label>Address line 1</label>
							<input value={form.line1} onChange={(e) => setForm(f => ({...f, line1: e.target.value}))} required />
						</div>
						<div>
							<label>Address line 2</label>
							<input value={form.line2} onChange={(e) => setForm(f => ({...f, line2: e.target.value}))} />
						</div>
						<div>
							<label>City</label>
							<input value={form.city} onChange={(e) => setForm(f => ({...f, city: e.target.value}))} required />
						</div>
						<div>
							<label>State / Province</label>
							<input value={form.state} onChange={(e) => setForm(f => ({...f, state: e.target.value}))} />
						</div>
						<div>
							<label>Postal code</label>
							<input value={form.postalCode} onChange={(e) => setForm(f => ({...f, postalCode: e.target.value}))} />
						</div>
						<div>
							<label>Country</label>
							<input value={form.country} onChange={(e) => setForm(f => ({...f, country: e.target.value}))} required />
						</div>
						<div style={{marginTop:12}}>
							<button type="submit" className="btn btn-primary">Save address</button>
							{address && <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>}
						</div>
					</form>
				)}
			</div>
			<div className="checkout-section">
				<h2>Order Summary</h2>
				{cart.length === 0 ? (
					<p>Your cart is empty</p>
				) : (
					<div className="order-items">
						{cart.map((item, i) => (
							<div key={i} className="order-item">
										<div className="order-item-thumb" style={{width:90, height:70, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
											{item.image ? (
												(() => {
													const { local, remote } = resolveImageSrc(item.image);
													return <img src={local || remote} alt={item.name} style={{maxWidth:'100%', maxHeight:'100%'}} onError={(e)=>{ if (remote && e.currentTarget.src!==remote) e.currentTarget.src = remote; }} />;
												})()
											) : (
												<div className="thumb-placeholder" style={{width:90, height:70}} />
											)}
										</div>
								<div className="order-item-info">
									<div className="order-item-name">{item.name}</div>
									<div className="order-item-qty">Qty: {item.quantity || 1}</div>
									<div className="order-item-price">Rs {(item.price || 0).toFixed(2)}</div>
								</div>
							</div>
						))}
						<div className="order-total"><strong>Total: Rs {cart.reduce((s,c) => s + (c.price || 0) * (c.quantity || 1), 0).toFixed(2)}</strong></div>
					</div>
				)}
				<div style={{marginTop:12}}>
					<button className="btn btn-primary" onClick={() => {
						if (!address) return alert('Please save a shipping address first');
						navigate('/payment');
					}}>Buy Now</button>
				</div>
			</div>
		</div>
	);
}

function getImageUrl(img) {
	if (!img) return null;
	const { local, remote } = resolveImageSrc(img.startsWith('/') ? img : `/uploads/${img}`);
	return local || remote;
}

