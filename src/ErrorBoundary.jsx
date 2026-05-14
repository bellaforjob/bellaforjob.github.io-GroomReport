import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error)
      return (
        <div className="fatal-error">
          <h1 className="fatal-error__title">GroomReport failed to load</h1>
          <p className="fatal-error__hint">
            From the project folder, run <code>npm install</code> then{' '}
            <code>npm run dev</code> (do not open the HTML file directly). Details:
          </p>
          <pre className="fatal-error__trace">{msg}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
