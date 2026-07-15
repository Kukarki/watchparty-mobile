// Hook that binds a game session to your existing Socket.IO client.
//   const game = useGameSocket(socket, sessionId);
//   game.state / game.hand / game.lastEvents / game.ended
//   game.move({ type: 'play', cardId, ... }, (res) => ...)
import { useCallback, useEffect, useRef, useState } from 'react';

export function useGameSocket(socket, sessionId) {
  const [state, setState] = useState(null);       // public state
  const [hand, setHand] = useState(null);         // { myHand, drawnCard }
  const [lobby, setLobby] = useState(null);       // pre-start session summary
  const [lastEvents, setLastEvents] = useState([]);
  const [ended, setEnded] = useState(null);       // { ranking }
  const sid = useRef(sessionId);
  sid.current = sessionId;

  useEffect(() => {
    if (!socket || !sessionId) return undefined;

    const onState = (msg) => { if (msg.sessionId === sid.current) setState(msg); };
    const onHand = (msg) => { if (msg.sessionId === sid.current) setHand(msg); };
    const onLobby = (msg) => { if (msg.sessionId === sid.current) setLobby(msg); };
    const onEvents = (msg) => { if (msg.sessionId === sid.current) setLastEvents(msg.events); };
    const onEnded = (msg) => { if (msg.sessionId === sid.current) setEnded(msg); };
    const onCancelled = (msg) => {
      if (msg.sessionId === sid.current) setEnded({ cancelled: true, ranking: [] });
    };

    socket.on('game:state', onState);
    socket.on('game:hand', onHand);
    socket.on('game:lobby', onLobby);
    socket.on('game:events', onEvents);
    socket.on('game:ended', onEnded);
    socket.on('game:cancelled', onCancelled);

    socket.emit('game:join', { sessionId }, () => {});

    return () => {
      socket.off('game:state', onState);
      socket.off('game:hand', onHand);
      socket.off('game:lobby', onLobby);
      socket.off('game:events', onEvents);
      socket.off('game:ended', onEnded);
      socket.off('game:cancelled', onCancelled);
    };
  }, [socket, sessionId]);

  const move = useCallback((m, cb) => {
    socket.emit('game:move', { sessionId: sid.current, move: m }, cb || (() => {}));
  }, [socket]);

  const start = useCallback((cb) => {
    socket.emit('game:start', { sessionId: sid.current }, cb || (() => {}));
  }, [socket]);

  const leave = useCallback(() => {
    socket.emit('game:leave', { sessionId: sid.current }, () => {});
  }, [socket]);

  return { state, hand, lobby, lastEvents, ended, move, start, leave };
}
