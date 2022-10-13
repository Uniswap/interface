"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.encodeText = encodeText;
exports.decodeText = decodeText;
exports.readableStreamTee = readableStreamTee;
exports.chainStreams = chainStreams;
exports.streamFromArray = streamFromArray;
exports.streamToString = streamToString;
exports.createBufferedTransformStream = createBufferedTransformStream;
exports.createFlushEffectStream = createFlushEffectStream;
exports.renderToInitialStream = renderToInitialStream;
exports.createHeadInjectionTransformStream = createHeadInjectionTransformStream;
exports.createDeferredSuffixStream = createDeferredSuffixStream;
exports.createInlineDataStream = createInlineDataStream;
exports.createSuffixStream = createSuffixStream;
exports.continueFromInitialStream = continueFromInitialStream;
var _nonNullable = require("../lib/non-nullable");
function encodeText(input) {
    return new TextEncoder().encode(input);
}
function decodeText(input, textDecoder) {
    return textDecoder ? textDecoder.decode(input, {
        stream: true
    }) : new TextDecoder().decode(input);
}
function readableStreamTee(readable) {
    const transformStream = new TransformStream();
    const transformStream2 = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const writer2 = transformStream2.writable.getWriter();
    const reader = readable.getReader();
    function read() {
        reader.read().then(({ done , value  })=>{
            if (done) {
                writer.close();
                writer2.close();
                return;
            }
            writer.write(value);
            writer2.write(value);
            read();
        });
    }
    read();
    return [
        transformStream.readable,
        transformStream2.readable
    ];
}
function chainStreams(streams) {
    const { readable , writable  } = new TransformStream();
    let promise = Promise.resolve();
    for(let i = 0; i < streams.length; ++i){
        promise = promise.then(()=>streams[i].pipeTo(writable, {
                preventClose: i + 1 < streams.length
            }));
    }
    return readable;
}
function streamFromArray(strings) {
    // Note: we use a TransformStream here instead of instantiating a ReadableStream
    // because the built-in ReadableStream polyfill runs strings through TextEncoder.
    const { readable , writable  } = new TransformStream();
    const writer = writable.getWriter();
    strings.forEach((str)=>writer.write(encodeText(str)));
    writer.close();
    return readable;
}
async function streamToString(stream) {
    const reader = stream.getReader();
    const textDecoder = new TextDecoder();
    let bufferedString = "";
    while(true){
        const { done , value  } = await reader.read();
        if (done) {
            return bufferedString;
        }
        bufferedString += decodeText(value, textDecoder);
    }
}
function createBufferedTransformStream(transform = (v)=>v) {
    let bufferedString = "";
    let pendingFlush = null;
    const flushBuffer = (controller)=>{
        if (!pendingFlush) {
            pendingFlush = new Promise((resolve)=>{
                setTimeout(async ()=>{
                    const buffered = await transform(bufferedString);
                    controller.enqueue(encodeText(buffered));
                    bufferedString = "";
                    pendingFlush = null;
                    resolve();
                }, 0);
            });
        }
        return pendingFlush;
    };
    const textDecoder = new TextDecoder();
    return new TransformStream({
        transform (chunk, controller) {
            bufferedString += decodeText(chunk, textDecoder);
            flushBuffer(controller);
        },
        flush () {
            if (pendingFlush) {
                return pendingFlush;
            }
        }
    });
}
function createFlushEffectStream(handleFlushEffect) {
    return new TransformStream({
        transform (chunk, controller) {
            const flushedChunk = encodeText(handleFlushEffect());
            controller.enqueue(flushedChunk);
            controller.enqueue(chunk);
        }
    });
}
function renderToInitialStream({ ReactDOMServer , element , streamOptions  }) {
    return ReactDOMServer.renderToReadableStream(element, streamOptions);
}
function createHeadInjectionTransformStream(inject) {
    let injected = false;
    return new TransformStream({
        transform (chunk, controller) {
            const content = decodeText(chunk);
            let index;
            if (!injected && (index = content.indexOf("</head")) !== -1) {
                injected = true;
                const injectedContent = content.slice(0, index) + inject() + content.slice(index);
                controller.enqueue(encodeText(injectedContent));
            } else {
                controller.enqueue(chunk);
            }
        }
    });
}
function createDeferredSuffixStream(suffix) {
    let suffixFlushed = false;
    let suffixFlushTask = null;
    return new TransformStream({
        transform (chunk, controller) {
            controller.enqueue(chunk);
            if (!suffixFlushed && suffix) {
                suffixFlushed = true;
                suffixFlushTask = new Promise((res)=>{
                    // NOTE: streaming flush
                    // Enqueue suffix part before the major chunks are enqueued so that
                    // suffix won't be flushed too early to interrupt the data stream
                    setTimeout(()=>{
                        controller.enqueue(encodeText(suffix));
                        res();
                    });
                });
            }
        },
        flush (controller) {
            if (suffixFlushTask) return suffixFlushTask;
            if (!suffixFlushed && suffix) {
                suffixFlushed = true;
                controller.enqueue(encodeText(suffix));
            }
        }
    });
}
function createInlineDataStream(dataStream) {
    let dataStreamFinished = null;
    return new TransformStream({
        transform (chunk, controller) {
            controller.enqueue(chunk);
            if (!dataStreamFinished) {
                const dataStreamReader = dataStream.getReader();
                // NOTE: streaming flush
                // We are buffering here for the inlined data stream because the
                // "shell" stream might be chunkenized again by the underlying stream
                // implementation, e.g. with a specific high-water mark. To ensure it's
                // the safe timing to pipe the data stream, this extra tick is
                // necessary.
                dataStreamFinished = new Promise((res)=>setTimeout(async ()=>{
                        try {
                            while(true){
                                const { done , value  } = await dataStreamReader.read();
                                if (done) {
                                    return res();
                                }
                                controller.enqueue(value);
                            }
                        } catch (err) {
                            controller.error(err);
                        }
                        res();
                    }, 0));
            }
        },
        flush () {
            if (dataStreamFinished) {
                return dataStreamFinished;
            }
        }
    });
}
function createSuffixStream(suffix) {
    return new TransformStream({
        flush (controller) {
            if (suffix) {
                controller.enqueue(encodeText(suffix));
            }
        }
    });
}
async function continueFromInitialStream(renderStream, { suffix , dataStream , generateStaticHTML , flushEffectHandler , flushEffectsToHead  }) {
    const closeTag = "</body></html>";
    const suffixUnclosed = suffix ? suffix.split(closeTag)[0] : null;
    if (generateStaticHTML) {
        await renderStream.allReady;
    }
    const transforms = [
        createBufferedTransformStream(),
        flushEffectHandler && !flushEffectsToHead ? createFlushEffectStream(flushEffectHandler) : null,
        suffixUnclosed != null ? createDeferredSuffixStream(suffixUnclosed) : null,
        dataStream ? createInlineDataStream(dataStream) : null,
        suffixUnclosed != null ? createSuffixStream(closeTag) : null,
        createHeadInjectionTransformStream(()=>{
            // TODO-APP: Inject flush effects to end of head in app layout rendering, to avoid
            // hydration errors. Remove this once it's ready to be handled by react itself.
            const flushEffectsContent = flushEffectHandler && flushEffectsToHead ? flushEffectHandler() : "";
            return flushEffectsContent;
        }), 
    ].filter(_nonNullable.nonNullable);
    return transforms.reduce((readable, transform)=>readable.pipeThrough(transform), renderStream);
}

//# sourceMappingURL=node-web-streams-helper.js.map