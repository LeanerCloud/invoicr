import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { ProviderEditor } from './components/editors/ProviderEditor';
import { ClientList } from './components/editors/ClientList';
import { ClientEditor } from './components/editors/ClientEditor';
import { InvoiceForm } from './components/editors/InvoiceForm';
import { InvoiceHistory } from './components/history/InvoiceHistory';
import { NewPersonaModal } from './components/editors/NewPersonaModal';
import { TemplateList } from './components/editors/TemplateList';

type View = 'provider' | 'clients' | 'client-edit' | 'client-new' | 'invoice' | 'history' | 'templates';

function App() {
  const [currentView, setCurrentView] = useState<View>('clients');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showNewPersonaModal, setShowNewPersonaModal] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleSelectPersona = (personaName: string) => {
    setSelectedPersona(personaName);
  };

  const handleSelectClient = (personaName: string, clientName: string) => {
    setSelectedPersona(personaName);
    setSelectedClient(clientName);
    setCurrentView('invoice');
  };

  const handleEditClient = (clientName: string) => {
    setSelectedClient(clientName);
    setCurrentView('client-edit');
  };

  const handleViewHistory = (clientName: string) => {
    setSelectedClient(clientName);
    setCurrentView('history');
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setCurrentView('client-new');
  };

  const handleBack = () => {
    setCurrentView('clients');
    setSelectedClient(null);
  };

  const handleClientSaved = () => {
    setCurrentView('clients');
    setSelectedClient(null);
    // Refresh sidebar to show new client
    setSidebarKey(k => k + 1);
  };

  const handlePersonaCreated = (personaName: string) => {
    setShowNewPersonaModal(false);
    setSelectedPersona(personaName);
    setCurrentView('provider');
    // Refresh sidebar
    setSidebarKey(k => k + 1);
  };

  const renderContent = () => {
    if (!selectedPersona) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select or create a business activity to get started
        </div>
      );
    }

    switch (currentView) {
      case 'provider':
        return (
          <ProviderEditor
            persona={selectedPersona}
            onNavigateToTemplates={() => setCurrentView('templates')}
          />
        );
      case 'clients':
        return (
          <ClientList
            persona={selectedPersona}
            onSelectClient={handleSelectClient.bind(null, selectedPersona)}
            onEditClient={handleEditClient}
            onViewHistory={handleViewHistory}
            onCreateClient={handleCreateClient}
          />
        );
      case 'client-edit':
        return selectedClient ? (
          <ClientEditor
            persona={selectedPersona}
            clientName={selectedClient}
            onBack={handleBack}
            onSaved={handleClientSaved}
          />
        ) : null;
      case 'client-new':
        return (
          <ClientEditor
            persona={selectedPersona}
            onBack={handleBack}
            onSaved={handleClientSaved}
          />
        );
      case 'invoice':
        return selectedClient ? (
          <InvoiceForm
            persona={selectedPersona}
            clientName={selectedClient}
            onBack={handleBack}
          />
        ) : null;
      case 'history':
        return selectedClient ? (
          <InvoiceHistory
            persona={selectedPersona}
            clientName={selectedClient}
            onBack={handleBack}
          />
        ) : null;
      case 'templates':
        return (
          <TemplateList
            persona={selectedPersona}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        <Sidebar
          currentView={currentView}
          selectedPersona={selectedPersona}
          selectedClient={selectedClient}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view === 'clients') setSelectedClient(null);
          }}
          onSelectPersona={handleSelectPersona}
          onSelectClient={handleSelectClient}
          onCreatePersona={() => setShowNewPersonaModal(true)}
          refreshTrigger={sidebarKey}
        />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>

      {showNewPersonaModal && (
        <NewPersonaModal
          onClose={() => setShowNewPersonaModal(false)}
          onCreated={handlePersonaCreated}
        />
      )}
    </MainLayout>
  );
}

export default App;
