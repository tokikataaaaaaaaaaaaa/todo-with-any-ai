import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from '@/app/(app)/settings/page'
import { useApiKeyStore } from '@/stores/api-key-store'
import type { ApiKey } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock useAuth
const mockLogout = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', displayName: 'Test User', email: 'user@github.com' },
    loading: false,
    logout: mockLogout,
  }),
}))

// Mock firebase
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock api-keys-client with resolved promises to prevent store errors
vi.mock('@/lib/api-keys-client', () => ({
  apiKeysClient: {
    listKeys: vi.fn().mockResolvedValue([]),
    createKey: vi.fn().mockResolvedValue({ key: 'sk-test', id: 'new', name: 'test', createdAt: '2026-01-01' }),
    deleteKey: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockKeys: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production Key',
    keyHash: 'hash1',
    createdAt: '2026-01-15T10:00:00Z',
    lastUsedAt: '2026-03-20T14:30:00Z',
  },
  {
    id: 'key-2',
    name: 'Development Key',
    keyHash: 'hash2',
    createdAt: '2026-02-01T08:00:00Z',
    lastUsedAt: null,
  },
]

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Override fetchKeys to no-op so it doesn't overwrite our test state
    useApiKeyStore.setState({
      keys: mockKeys,
      loading: false,
      error: null,
      fetchKeys: vi.fn() as unknown as () => Promise<void>,
      createKey: vi.fn().mockResolvedValue({ key: 'sk-test' }) as unknown as (name: string) => Promise<{ key: string }>,
      deleteKey: vi.fn().mockResolvedValue(undefined) as unknown as (id: string) => Promise<void>,
    })
  })

  it('should display settings heading', () => {
    render(<SettingsPage />)
    expect(screen.getByText('設定')).toBeInTheDocument()
  })

  describe('API key list', () => {
    it('should display API keys section title', () => {
      render(<SettingsPage />)
      expect(screen.getByText('API Keys')).toBeInTheDocument()
    })

    it('should display all API keys', () => {
      render(<SettingsPage />)
      expect(screen.getByText('Production Key')).toBeInTheDocument()
      expect(screen.getByText('Development Key')).toBeInTheDocument()
    })

    it('should show created date for each key', () => {
      render(<SettingsPage />)
      // Just check the date is present in some form
      expect(screen.getByText(/2026-01-15/)).toBeInTheDocument()
    })

    it('should show last used date when available', () => {
      render(<SettingsPage />)
      expect(screen.getByText(/2026-03-20/)).toBeInTheDocument()
    })

    it('should show "未使用" for keys never used', () => {
      render(<SettingsPage />)
      expect(screen.getByText(/未使用/)).toBeInTheDocument()
    })

    it('should show delete button for each key', () => {
      render(<SettingsPage />)
      const deleteButtons = screen.getAllByRole('button', { name: /削除/i })
      expect(deleteButtons).toHaveLength(2)
    })

    it('should show empty state when no keys', () => {
      useApiKeyStore.setState({ keys: [], loading: false, error: null })
      render(<SettingsPage />)
      expect(screen.getByText(/APIキーがありません/i)).toBeInTheDocument()
    })
  })

  describe('create key button', () => {
    it('should show "APIキーを発行する" button', () => {
      render(<SettingsPage />)
      expect(screen.getByRole('button', { name: /APIキーを発行する/i })).toBeInTheDocument()
    })

    it('should open create dialog when button clicked', () => {
      render(<SettingsPage />)
      fireEvent.click(screen.getByRole('button', { name: /APIキーを発行する/i }))
      expect(screen.getByText(/キー名/i)).toBeInTheDocument()
    })
  })

  describe('account section', () => {
    it('should display user email', () => {
      render(<SettingsPage />)
      expect(screen.getByText('user@github.com')).toBeInTheDocument()
    })

    it('should show logout button', () => {
      render(<SettingsPage />)
      expect(screen.getByRole('button', { name: /ログアウト/i })).toBeInTheDocument()
    })

    it('should call logout on button click', () => {
      render(<SettingsPage />)
      fireEvent.click(screen.getByRole('button', { name: /ログアウト/i }))
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      useApiKeyStore.setState({ keys: [], loading: true, error: null })
      render(<SettingsPage />)
      expect(screen.getByTestId('api-keys-loading')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when error occurs', () => {
      useApiKeyStore.setState({ keys: [], loading: false, error: 'Failed to load keys' })
      render(<SettingsPage />)
      expect(screen.getByText(/Failed to load keys/)).toBeInTheDocument()
    })
  })
})
