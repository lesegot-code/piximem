import { Link, useNavigate } from "react-router-dom";

function Navigation() {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 40px',
      borderBottom: '2px solid #333',
      background: '#0F172A'
    }}>
      {/* Left side - Logo + Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{
            width: '40px',
            height: '40px',
            border: '2px solid #333',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#F8FAFC',
            background: '#1E293B'
          }}>📷</span>
          <div>
            <div style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: '18px' }}>Pixel Memory</div>
            <div style={{ color: '#F59E0B', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase' }}>PixiMem</div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '30px' }}>
          <Link to="/home" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
          <Link to="/profile/1" style={{ color: '#6b6b6b', textDecoration: 'none', fontWeight: '600' }}>Profile</Link>
        </div>
      </div>

      {/* Right side - Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{
          border: '2px solid #333',
          padding: '8px 20px',
          borderRadius: '4px',
          background: 'transparent',
          color: '#F8FAFC',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>+ Create</button>

        <button onClick={() => navigate('/')} style={{
          border: '2px solid #333',
          padding: '8px 20px',
          borderRadius: '4px',
          background: 'transparent',
          color: '#F8FAFC',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>Logout</button>
      </div>
    </nav>
  );
}

export default Navigation;