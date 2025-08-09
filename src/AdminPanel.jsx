import { useState, useEffect } from 'react'
import './AdminPanel.css'

function AdminPanel() {
  const [expandedCard, setExpandedCard] = useState(null)
  const [pendingLocations, setPendingLocations] = useState([])
  const [approvedLocations, setApprovedLocations] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [userAccess, setUserAccess] = useState([])
  const [rankings, setRankings] = useState([])
  const [comments, setComments] = useState({})
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ userName: '', email: '', senha: '', userType: 'usuario' })
  const [siteLocations, setSiteLocations] = useState([])
  const [trashedLocations, setTrashedLocations] = useState([])
  
  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/usuarios')
      if (response.ok) {
        const users = await response.json()
        setUserAccess(users)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadRanking = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ranking')
      if (response.ok) {
        const ranking = await response.json()
        setRankings(ranking)
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/comentarios/all')
      if (response.ok) {
        const commentsData = await response.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  const loadPendingLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locais/pendentes')
      if (response.ok) {
        const pending = await response.json()
        setPendingLocations(pending)
      }
    } catch (error) {
      // Fallback para dados mockados
      const initialData = [
        {
          id: 1,
          name: 'Cachoeira Secreta',
          city: 'Manaus, AM',
          category: 'Natureza',
          submittedBy: 'João Silva',
          date: '2025-01-15',
          description: 'Uma cachoeira escondida na floresta amazônica',
          coordinates: '-3.1190, -60.0217'
        }
      ]
      setPendingLocations(initialData)
    }
  }

  const loadApprovedLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locais/aprovados')
      if (response.ok) {
        const approved = await response.json()
        setApprovedLocations(approved)
      }
    } catch (error) {
      console.error('Erro ao carregar locais aprovados:', error)
    }
  }



  const loadSiteLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locais')
      if (response.ok) {
        const locais = await response.json()
        setSiteLocations(locais)
      }
    } catch (error) {
      console.error('Erro ao carregar locais do site:', error)
    }
  }

  const loadTrashedLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locais/lixeira')
      if (response.ok) {
        const lixeira = await response.json()
        setTrashedLocations(lixeira)
      }
    } catch (error) {
      // Fallback localStorage
      const lixeira = JSON.parse(localStorage.getItem('trashedLocations')) || []
      setTrashedLocations(lixeira)
    }
  }

  useEffect(() => {
    // Carrega locais pendentes da API
    loadPendingLocations()
    
    // Carrega locais aprovados da API
    loadApprovedLocations()
    
    // Carrega dados da API
    loadUsers()
    loadRanking()
    loadComments()
    
    // Carrega locais do site e lixeira da API
    loadSiteLocations()
    loadTrashedLocations()
  }, [])

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/locais/aprovar/${id}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Local aprovado com sucesso!')
        loadPendingLocations()
        loadApprovedLocations()
      } else {
        alert('Erro ao aprovar local')
      }
    } catch (error) {
      // Fallback localStorage
      const locationToApprove = pendingLocations.find(location => location.id === id)
      const updatedLocations = pendingLocations.filter(location => location.id !== id)
      
      let approvedLocations = JSON.parse(localStorage.getItem('approvedLocations')) || []
      approvedLocations.push(locationToApprove)
      localStorage.setItem('approvedLocations', JSON.stringify(approvedLocations))
      
      setPendingLocations(updatedLocations)
      localStorage.setItem('pendingLocations', JSON.stringify(updatedLocations))
      
      alert('Local aprovado localmente!')
    }
  }

  const handleReject = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/locais/rejeitar/${id}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Local rejeitado!')
        loadPendingLocations()
      } else {
        alert('Erro ao rejeitar local')
      }
    } catch (error) {
      // Fallback localStorage
      const updatedLocations = pendingLocations.filter(location => location.id !== id)
      setPendingLocations(updatedLocations)
      localStorage.setItem('pendingLocations', JSON.stringify(updatedLocations))
      alert('Local rejeitado localmente!')
    }
  }

  const handleRemove = (id) => {
    if (confirm('Tem certeza que deseja remover este local?')) {
      const locationToRemove = approvedLocations.find(location => location.id === id)
      const updatedApproved = approvedLocations.filter(location => location.id !== id)
      
      // Remove da lista de aprovados
      setApprovedLocations(updatedApproved)
      localStorage.setItem('approvedLocations', JSON.stringify(updatedApproved))
      
      // Remove das categorias do Amazonas se existir
      if (locationToRemove && (locationToRemove.city.toLowerCase().includes('am') || locationToRemove.city.toLowerCase().includes('amazonas'))) {
        let locaisAdicionados = JSON.parse(localStorage.getItem('locaisAdicionados')) || []
        locaisAdicionados = locaisAdicionados.filter(local => local.nome !== locationToRemove.name)
        localStorage.setItem('locaisAdicionados', JSON.stringify(locaisAdicionados))
      }
      
      alert('Local removido com sucesso!')
    }
  }

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  const handleRemoveUser = async (userId, index) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/usuarios/${userId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          alert('Usuário excluído com sucesso!')
          loadUsers()
        } else {
          alert('Erro ao excluir usuário')
        }
      } catch (error) {
        // Fallback localStorage
        const updatedUsers = userAccess.filter((_, i) => i !== index)
        setUserAccess(updatedUsers)
        localStorage.setItem('userAccess', JSON.stringify(updatedUsers))
        alert('Usuário excluído localmente!')
      }
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (newUser.userName.trim() && newUser.email.trim() && newUser.senha.trim()) {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: newUser.userName,
            email: newUser.email,
            senha: newUser.senha,
            tipoUsuario: newUser.userType
          })
        })
        
        if (response.ok) {
          setNewUser({ userName: '', email: '', senha: '', userType: 'usuario' })
          setShowAddUserModal(false)
          alert('Usuário cadastrado com sucesso!')
          // Recarregar lista de usuários
          loadUsers()
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao cadastrar usuário')
        }
      } catch (error) {
        alert('Erro de conexão com o servidor')
      }
    } else {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Email e Senha)!')
    }
  }

  const handleRemoveLocation = async (id) => {
    if (confirm('Tem certeza que deseja mover este local para a lixeira?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/locais/excluir/${id}`, {
          method: 'POST'
        })
        
        if (response.ok) {
          alert('Local movido para a lixeira!')
          loadSiteLocations()
          loadTrashedLocations()
        } else {
          alert('Erro ao mover local para lixeira')
        }
      } catch (error) {
        // Fallback localStorage
        const locationToTrash = siteLocations.find(location => location.id === id)
        const updatedTrash = [...trashedLocations, {...locationToTrash, trashedAt: new Date().toLocaleString('pt-BR')}]
        setTrashedLocations(updatedTrash)
        localStorage.setItem('trashedLocations', JSON.stringify(updatedTrash))
        
        const updatedLocations = siteLocations.filter(location => location.id !== id)
        setSiteLocations(updatedLocations)
        
        alert('Local movido para lixeira localmente!')
      }
    }
  }

  const handleRestoreLocation = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/locais/restaurar/${id}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Local restaurado com sucesso!')
        loadSiteLocations()
        loadTrashedLocations()
      } else {
        alert('Erro ao restaurar local')
      }
    } catch (error) {
      // Fallback localStorage
      const locationToRestore = trashedLocations.find(location => location.id === id)
      const updatedTrash = trashedLocations.filter(location => location.id !== id)
      setTrashedLocations(updatedTrash)
      localStorage.setItem('trashedLocations', JSON.stringify(updatedTrash))
      
      const restoredLocation = {...locationToRestore}
      delete restoredLocation.trashedAt
      setSiteLocations([...siteLocations, restoredLocation])
      
      alert('Local restaurado localmente!')
    }
  }

  const handlePermanentDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este local? Esta ação não pode ser desfeita!')) {
      const updatedTrash = trashedLocations.filter(location => location.id !== id)
      setTrashedLocations(updatedTrash)
      localStorage.setItem('trashedLocations', JSON.stringify(updatedTrash))
      alert('Local excluído permanentemente!')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Painel Administrativo</h1>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pendentes ({pendingLocations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Aprovados ({approvedLocations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuários ({userAccess.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            Ranking ({rankings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locais do Site ({siteLocations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => setActiveTab('trash')}
          >
            🗑️ Lixeira ({trashedLocations.length})
          </button>
        </div>
      </div>
      
      {activeTab === 'users' && (
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <button 
            onClick={() => setShowAddUserModal(true)}
            style={{background: '#28a745', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'}}
          >
            + Cadastrar Usuário
          </button>
        </div>
      )}
      
      <div className="admin-grid">
        {activeTab === 'pending' && pendingLocations.map(location => (
          <div key={location.id} className={`admin-card ${expandedCard === location.id ? 'expanded' : ''}`}>
            <div className="card-header">
              <h3>{location.name}</h3>
              <span className="category-badge">{location.category}</span>
            </div>
            
            <div className="card-info">
              <p><strong>Cidade:</strong> {location.city}</p>
              <p><strong>Enviado por:</strong> {location.submittedBy}</p>
              <p><strong>Data:</strong> {location.date}</p>
            </div>

            {expandedCard === location.id && (
              <div className="card-details">
                <p><strong>Descrição:</strong> {location.description}</p>
                <p><strong>Coordenadas:</strong> {location.coordinates}</p>
              </div>
            )}

            <div className="card-actions">
              <button 
                className="expand-btn"
                onClick={() => toggleExpand(location.id)}
              >
                {expandedCard === location.id ? 'Recolher' : 'Expandir'}
              </button>
              <button 
                className="approve-btn"
                onClick={() => handleApprove(location.id)}
              >
                Aprovar
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleReject(location.id)}
              >
                Rejeitar
              </button>
            </div>
          </div>
        ))}
        
        {activeTab === 'approved' && approvedLocations.map(location => (
          <div key={location.id} className={`admin-card ${expandedCard === location.id ? 'expanded' : ''}`}>
            <div className="card-header">
              <h3>{location.name}</h3>
              <span className="category-badge approved">{location.category}</span>
            </div>
            
            <div className="card-info">
              <p><strong>Cidade:</strong> {location.city}</p>
              <p><strong>Enviado por:</strong> {location.submittedBy}</p>
              <p><strong>Data:</strong> {location.date}</p>
            </div>

            {expandedCard === location.id && (
              <div className="card-details">
                <p><strong>Descrição:</strong> {location.description}</p>
                <p><strong>Coordenadas:</strong> {location.coordinates}</p>
              </div>
            )}

            <div className="card-actions">
              <button 
                className="expand-btn"
                onClick={() => toggleExpand(location.id)}
              >
                {expandedCard === location.id ? 'Recolher' : 'Expandir'}
              </button>
              <button 
                className="remove-btn"
                onClick={() => handleRemove(location.id)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        
        {activeTab === 'users' && userAccess.map((user, index) => (
          <div key={index} className="admin-card">
            <div className="card-header">
              <h3>{user.userName}</h3>
              <span className={`category-badge ${user.userType === 'adm' ? 'admin' : 'user'}`}>{user.userType === 'adm' ? 'Admin' : 'Usuário'}</span>
            </div>
            
            <div className="card-info">
              <p><strong>Email:</strong> {user.email || 'N/A'}</p>
              <p><strong>Último acesso:</strong> {user.lastAccess}</p>
              <p><strong>Total de acessos:</strong> {user.accessCount}</p>
              <p><strong>IP:</strong> {user.ip || 'N/A'}</p>
            </div>
            
            <div className="card-actions">
              <button 
                className="remove-btn"
                onClick={() => handleRemoveUser(user.ID || user.id, index)}
              >
                Excluir Usuário
              </button>
            </div>
          </div>
        ))}
        
        {activeTab === 'ranking' && rankings.map((place, index) => {
          const placeComments = comments[place.name] || []
          const isExpanded = expandedCard === `ranking-${index}`
          return (
            <div key={index} className="admin-card">
              <div className="card-header">
                <h3>#{index + 1} {place.name}</h3>
                <span className={`category-badge ranking-${index < 3 ? 'top' : 'normal'}`}>
                  ⭐ {place.averageRating.toFixed(1)}
                </span>
              </div>
              
              <div className="card-info">
                <p><strong>Avaliação média:</strong> {place.averageRating.toFixed(2)} estrelas</p>
                <p><strong>Total de avaliações:</strong> {place.totalRatings}</p>
                <p><strong>Total de comentários:</strong> {placeComments.length}</p>
                <p><strong>Posição:</strong> {index + 1}º lugar</p>
              </div>
              
              {placeComments.length > 0 && (
                <div className="card-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => toggleExpand(`ranking-${index}`)}
                  >
                    {isExpanded ? 'Ocultar Comentários' : `Ver Comentários (${placeComments.length})`}
                  </button>
                </div>
              )}
              
              {isExpanded && placeComments.length > 0 && (
                <div style={{marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px'}}>
                  <h4 style={{marginBottom: '0.8rem', color: '#495057', fontSize: '1rem'}}>💬 Todos os Comentários:</h4>
                  {placeComments.map((comment, idx) => (
                    <div key={idx} style={{marginBottom: '0.8rem', padding: '0.8rem', background: 'white', borderRadius: '8px', border: '1px solid #dee2e6'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem'}}>
                        <strong style={{color: '#495057'}}>{comment.userName}</strong>
                        <span style={{fontSize: '0.75rem', color: '#6c757d'}}>{comment.date}</span>
                      </div>
                      <p style={{fontSize: '0.9rem', color: '#333', lineHeight: '1.4'}}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        {activeTab === 'locations' && (
          <div style={{width: '100%'}}>
            {['monumentos', 'natureza', 'gastronomia', 'cultura'].map(categoria => {
              const locaisCategoria = siteLocations.filter(location => location.categoria === categoria)
              if (locaisCategoria.length === 0) return null
              
              return (
                <div key={categoria} style={{marginBottom: '3rem'}}>
                  <h3 style={{textAlign: 'center', color: '#2c3e50', fontSize: '1.8rem', marginBottom: '2rem', textTransform: 'capitalize'}}>
                    {categoria === 'monumentos' ? '🏦 Monumentos' : 
                     categoria === 'natureza' ? '🌳 Natureza' :
                     categoria === 'gastronomia' ? '🍽️ Gastronomia' : '🎨 Cultura'}
                  </h3>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
                    {locaisCategoria.map((location) => (
                      <div key={location.id} className="admin-card">
                        <div className="card-header">
                          <h3>{location.nome}</h3>
                          <span className={`category-badge`}>{location.categoria}</span>
                        </div>
                        
                        <div className="card-info">
                          <p><strong>Cidade:</strong> {location.cidade} - {location.estado}</p>
                          <p><strong>Descrição:</strong> {location.descricao}</p>
                          <p><strong>Localização:</strong> {location.localizacao || 'N/A'}</p>
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="remove-btn"
                            onClick={() => handleRemoveLocation(location.id)}
                          >
                            Mover para Lixeira
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {activeTab === 'trash' && trashedLocations.map((location) => (
          <div key={location.id} className="admin-card">
            <div className="card-header">
              <h3>{location.nome}</h3>
              <span className={`category-badge`}>{location.categoria}</span>
            </div>
            
            <div className="card-info">
              <p><strong>Cidade:</strong> {location.cidade} - {location.estado}</p>
              <p><strong>Descrição:</strong> {location.descricao}</p>
              <p><strong>Excluído em:</strong> {location.trashedAt}</p>
            </div>
            
            <div className="card-actions">
              <button 
                className="approve-btn"
                onClick={() => handleRestoreLocation(location.id)}
              >
                Restaurar
              </button>
              <button 
                className="reject-btn"
                onClick={() => handlePermanentDelete(location.id)}
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showAddUserModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{background: 'white', padding: '2rem', borderRadius: '15px', width: '400px', maxWidth: '90%'}}>
            <h3 style={{marginBottom: '1rem', color: '#2c3e50'}}>Cadastrar Novo Usuário</h3>
            <form onSubmit={handleAddUser}>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#333'}}>Nome do Usuário:</label>
                <input 
                  type="text" 
                  value={newUser.userName}
                  onChange={(e) => setNewUser({...newUser, userName: e.target.value})}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem'}}
                  required
                />
              </div>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#333'}}>Email:</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem'}}
                  required
                />
              </div>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#333'}}>Senha:</label>
                <input 
                  type="password" 
                  value={newUser.senha}
                  onChange={(e) => setNewUser({...newUser, senha: e.target.value})}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem'}}
                  required
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#333'}}>Tipo de Usuário:</label>
                <select 
                  value={newUser.userType}
                  onChange={(e) => setNewUser({...newUser, userType: e.target.value})}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem'}}
                >
                  <option value="usuario">Usuário</option>
                  <option value="adm">Administrador</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <button type="submit" style={{flex: 1, background: '#28a745', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer'}}>Cadastrar</button>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{flex: 1, background: '#6c757d', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer'}}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel