import React, { useState } from 'react';
import './components.css';

interface RepoOverviewProps {
    onDataLoaded: (repo: string) => void;
}

export const RepoOverview: React.FC<RepoOverviewProps> = ({ onDataLoaded }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url) return;
        console.log("Triggering analysis for:", url);
        setLoading(true);
        setError('');
        setData(null);
        try {
            const response = await fetch('http://localhost:8080/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ repoUrl: url }),
            });

            console.log("Response status:", response.status);
            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            console.log("Analysis Result:", result);

            if (result.error) {
                setError(result.error);
            } else {
                setData(result);
                onDataLoaded(url);
            }
        } catch (err: any) {
            console.error("Analysis Error:", err);
            setError(err.message || 'Error connecting to GitSense Engine.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card glass repo-overview">
            <h2 className="title">GitSense Analyzer</h2>
            <div className="input-group">
                <input
                    type="text"
                    placeholder="Enter a GitHub Repository URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-field"
                />
                <button onClick={handleAnalyze} disabled={loading || !url} className="primary-btn">
                    {loading ? <span className="spinner"></span> : 'Analyze Project'}
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            {data && data.metrics && (
                <div className="results fade-in">
                    <div className="metrics-grid">
                        <div className="metric-box">
                            <h3>Files Scanned</h3>
                            <p className="value">{data.metrics.files_scanned}</p>
                        </div>
                        <div className="metric-box">
                            <h3>Source Files</h3>
                            <p className="value">{data.metrics.source_files}</p>
                        </div>
                        <div className="metric-box">
                            <h3>Lines of Code</h3>
                            <p className="value">{data.metrics.lines_of_code}</p>
                        </div>
                        <div className="metric-box code-quality">
                            <h3>Quality Score</h3>
                            <p className="value highlight">{data.metrics.quality_score}/100</p>
                        </div>
                    </div>


                    <div className="details-section">
                        <h3 className="section-title">Security Issues Detected ({data.security_issues?.length || 0})</h3>
                        {data.security_issues?.length > 0 ? (
                            <ul className="issue-list">
                                {data.security_issues.map((issue: any, idx: number) => (
                                    <li key={idx} className={`issue-item ${issue.severity.toLowerCase()}`}>
                                        <strong>[{issue.severity}]</strong> {issue.file}:{issue.line} - {issue.description}
                                        {issue.ai_remediation && (
                                            <div className="remediation">✨ Fix Suggestion: <code>{issue.ai_remediation}</code></div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="success-text">🎉 No severe security issues found.</p>}
                    </div>

                    <div className="details-section">
                        <h3 className="section-title">Top Contributors</h3>
                        <ul className="contributor-list">
                            {data.git_history?.top_contributors?.map((c: any, i: number) => (
                                <li key={i}><span className="name">{c.name}</span> <span className="commits">{c.commits} commits</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
