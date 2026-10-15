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
        <div className="min-h-[400px] p-8 m-4 rounded-xl border border-red-200 bg-red-50/70 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="max-w-lg space-y-2">
            <h3 className="text-lg font-bold text-red-950">
              {this.props.fallbackTitle || 'Ocorreu um erro inesperado nesta tela'}
            </h3>
            <p className="text-xs text-red-800 leading-relaxed">
              {this.state.error?.message ||
                'Não foi possível renderizar este componente devido a uma instabilidade temporária. Os detalhes foram registrados no console do navegador.'}
            </p>
            {this.state.error?.stack && (
              <details className="mt-2 text-left bg-white/80 p-3 rounded-lg border border-red-200/80 text-[11px] font-mono text-red-900 max-h-40 overflow-auto">
                <summary className="cursor-pointer font-semibold text-red-700 hover:underline">
                  Ver detalhes técnicos da falha
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </details>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={this.handleReset}
              variant="default"
              size="sm"
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Tentar novamente
            </Button>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                window.location.href = '/'
              }}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Ir para o Início
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
