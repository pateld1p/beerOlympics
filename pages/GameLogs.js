import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/GameLogs.module.css';
import { useRouter } from 'next/router';

export default function GameLogs() {
  const [gameLogs, setGameLogs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGameLogs = async () => {
      try {
        const gamesCollectionRef = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesCollectionRef);

        const logs = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort logs by timestamp in descending order (most recent first)
        logs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        setGameLogs(logs);
      } catch (error) {
        console.error("Error fetching game logs:", error);
      }
    };

    fetchGameLogs();
  }, []);

  const handleGoBack = () => {
    router.push('/admin'); 
  };

  return (
    <div className={styles.container}>
      <button onClick={handleGoBack} className={styles.backButton}>Back</button>
      <h1>Game Logs</h1>
      {gameLogs.length > 0 ? (
        <table className={styles.logTable}>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Game Name</th>
              <th>Team A</th>
              <th>Team B</th>
            </tr>
          </thead>
          <tbody>
            {gameLogs.map(log => (
              <tr key={log.id}>
                <td>{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'No date available'}</td>
                <td>{log.game}</td>
                <td className={log.winner === 'Team A' ? styles.winnerHighlight : ''}>
                  {log.playersA ? log.playersA.map(player => player.name).join(', ') : 'No players'}
                </td>
                <td className={log.winner === 'Team B' ? styles.winnerHighlight : ''}>
                  {log.playersB ? log.playersB.map(player => player.name).join(', ') : 'No players'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No game logs available.</p>
      )}
    </div>
  );
}
