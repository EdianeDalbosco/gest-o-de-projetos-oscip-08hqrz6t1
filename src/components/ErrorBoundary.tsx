import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRÍTICO: Erro capturado por ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] p-8 m-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-red-900">
              {this.props.fallbackTitle || 'Ocorreu um erro inesperado nesta tela'}
            </h3>
            <p className="text-xs text-red-700">
              {this.state.error?.message ||
                'Não foi possível renderizar este componente. Os detalhes foram registrados no console.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-white border-red-300 text-red-800 hover:bg-red-100"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Recarregar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
