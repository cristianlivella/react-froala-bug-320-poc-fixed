import React, {createRef, useCallback, useEffect, useState} from 'react';

import './App.css';
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/js/plugins/font_size.min.js'
import 'froala-editor/js/plugins/colors.min.js'
import 'froala-editor/js/plugins/align.min.js'
import 'froala-editor/js/plugins/lists.min.js'
import 'froala-editor/js/plugins/link.min.js'
import 'froala-editor/js/plugins/table.min.js'
import 'froala-editor/js/plugins/code_view.min'

import FroalaEditor from 'react-froala-wysiwyg';

function App() {
    // this is an arbitrary value, it just need to be bigger than API response time
    const RENDERING_DELAY = 1500;

    // set to 0 to try the bug, with value greater the editor is updated correctly
    const [additionalDelay, setAdditionalDelay] = useState(0);

    const [showEditor, setShowEditor] = useState(false);
    const [model, setModel] = useState<string | undefined>(undefined)
    const [log, setLog] = useState<string[]>([]);
    const [editorContainsModel, setEditorContainsModel] = useState(false);

    const editorContainerRef = createRef<HTMLDivElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();

    const pushLog = useCallback((message: string) => {
        setLog(currLog => {
            return [...currLog, (new Date().toISOString()) + ': ' + message]
        });
    }, [])

    const updateStatus = useCallback(() => {
        if (editorContainerRef.current) {
            setEditorContainsModel(editorContainerRef.current.innerHTML.includes(model ?? ''))
        }
    }, [editorContainerRef, model])

    useEffect(() => {
        updateStatus();

        const timeout = setTimeout(updateStatus, 500)
        return () => clearTimeout(timeout)
    }, [editorContainerRef, model, updateStatus]);

    useEffect(() => {
        pushLog('Editor reset');
        setShowEditor(false)
        setModel(undefined)
        setTimeout(() => {
            pushLog('Start editor rendering');
            setShowEditor(true)
        }, RENDERING_DELAY)
    }, [additionalDelay, pushLog])

    useEffect(() => {
        pushLog('Start API request');
        const startRequestTime = new Date().getTime();
        fetch('https://catfact.ninja/fact').then(r => r.json()).then(res => {
            const elapsedTime = new Date().getTime() - startRequestTime;
            pushLog('Received API response - Time elapsed: ' + elapsedTime + 'ms');
            setTimeout(() => {
                pushLog('Update model');
                setModel(res.fact);
            }, RENDERING_DELAY + additionalDelay - elapsedTime)
        })
    }, [RENDERING_DELAY, additionalDelay, pushLog])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [textareaRef, log])

  return (
    <div style={{padding: '8px'}}>
        <div ref={editorContainerRef} style={{height: '200px'}}>
            {showEditor && (
                <FroalaEditor
                    model={model}
                    config={{
                        events: {
                            initialized: () => {
                                pushLog('Editor initialized')
                            }
                        }
                    }}
                />
            )}
        </div>
        <div style={{display: 'flex', height: '200px', width: '100%'}}>
            <textarea ref={textareaRef} value={log.join('\n')} readOnly={true}  style={{flex: '1', resize: 'none'}} />
            <div style={{flex: '1', padding: '0 8px'}}>
                <p>
                    Proof of concept for the bug{' '}
                    <a href='https://github.com/froala/react-froala-wysiwyg/issues/320' target='_blank' rel='noreferrer'>#320</a>{' '}
                    of <a href='https://github.com/froala/react-froala-wysiwyg' target='_blank' rel='noreferrer'>react-froala-wysiwyg</a>.
                </p>
                <p>
                    Here you can set the delay (milliseconds) between the editor rendering and the model state update.{' '}
                    With 0 you can see the bug, with big values ({'>'} 30) should work properly.
                </p>
                <input type='number' min={0} max={1000} value={additionalDelay} onChange={e => setAdditionalDelay(parseInt(e.target.value, 10))} />
                <h3 style={{marginBottom: 0}}>Model state is:</h3>
                <p style={{marginTop: 0}}>{model}</p>

                {(editorContainsModel && model) && (
                    <p>Editor loaded and updated correctly.</p>
                )}

                {(!editorContainsModel && model) && (
                    <h2>Editor doesn't contain the updated model!</h2>
                )}
            </div>
        </div>

    </div>
  );
}

export default App;
