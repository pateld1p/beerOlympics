import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, updateDoc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Admin.module.css';

// team A = Green
// team B = Blue

export default function Admin() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Fetch players when the component mounts
  useEffect(() => {
    const fetchPlayers = async () => {
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const teamA = [];
      const teamB = [];

      playersSnapshot.forEach((doc) => {
        const playerData = doc.data();
        if (playerData.team === 'teamA') {
          teamA.push({ id: doc.id, name: playerData.name });
        } else if (playerData.team === 'teamB') {
          teamB.push({ id: doc.id, name: playerData.name });
        }
      });
      // Sort players alphabetically by name
      teamA.sort((a, b) => a.name.localeCompare(b.name));
      teamB.sort((a, b) => a.name.localeCompare(b.name));

      setTeamAPlayers(teamA);
      setTeamBPlayers(teamB);
    };

    fetchPlayers();
  }, []);

  const handleResetTeamScore = async (team) => {
    const confirmation = window.confirm(`Are you sure you want to reset all scores for ${team}?`);
    if (!confirmation) return;

    try {
      const teamRef = doc(db, 'teams', team === 'Team A' ? 'Team A' : 'Team B');
      const teamSnapshot = await getDoc(teamRef);
      if (!teamSnapshot.exists()) {
        await setDoc(teamRef, { points: 0 });
      } else {
        await updateDoc(teamRef, { points: 0 });
      }
      
      const playersSnapshot = await getDocs(collection(db, 'players'));
      playersSnapshot.forEach(async (playerDoc) => {
        if (playerDoc.data().team === (team === 'Team A' ? 'teamA' : 'teamB')) {
          await updateDoc(playerDoc.ref, { score: 0 });
          const gamesCollectionRef = collection(db, 'players', playerDoc.id, 'games');
          const gamesSnapshot = await getDocs(gamesCollectionRef);
          gamesSnapshot.forEach(async (gameDoc) => {
            await updateDoc(gameDoc.ref, { score: 0 });
          });
        }
      });
      alert(`${team} scores have been reset.`);
    } catch (error) {
      console.error(`Error resetting ${team} scores: `, error);
    }
  };

  const handleClearAllRecords = async () => {
    const confirmation = window.confirm('Are you sure you want to clear all game records?');
    if (!confirmation) return;

    try {
      const gamesCollectionRef = collection(db, 'games');
      const gamesSnapshot = await getDocs(gamesCollectionRef);
      gamesSnapshot.forEach(async (gameDoc) => {
        await deleteDoc(gameDoc.ref);
      });

      alert('All game records have been deleted.');
    } catch (error) {
      console.error('Error deleting game records: ', error);
    }
  };

  const handleViewGameLogs = () => {
    router.push('/GameLogs');
  };

  const handleDeletePlayers = async () => {
    try {
      for (const playerId of selectedPlayers) {
        await deleteDoc(doc(db, 'players', playerId));
        console.log(`Deleted player with ID: ${playerId}`);
      }
      alert('Selected players have been deleted.');
      setShowDeleteModal(false);
      setSelectedPlayers([]);
      // Update the player lists after deletion
      setTeamAPlayers(teamAPlayers.filter(player => !selectedPlayers.includes(player.id)));
      setTeamBPlayers(teamBPlayers.filter(player => !selectedPlayers.includes(player.id)));
    } catch (error) {
      console.error('Error deleting players: ', error);
    }
  };

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };


  return (
    <div className={styles.container}>
      <h1>Admin Controls</h1>
      <button onClick={handleViewGameLogs} className={styles.GameLogsButton}>
        View Game Logs
      </button>
      <button onClick={() => handleResetTeamScore('Team A')} className={styles.controlButton}>
        Reset Team Green Scores
      </button>
      <button onClick={() => handleResetTeamScore('Team B')} className={styles.controlButton}>
        Reset Team Blue Scores
      </button>
      <button onClick={handleClearAllRecords} className={styles.controlButton}>
        Clear All Records
      </button>
      <button onClick={() => setShowDeleteModal(true)} className={styles.controlButton}>
        Delete Players
      </button>
      <button onClick={() => router.push('/')} className={styles.backButton}>Back to Home</button>

      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Select Players to Delete</h3>
            <div className={styles.teamColumns}>
              <div className={styles.teamColumn}>
                <h4>Team A</h4>
                <ul className={styles.playerList}>
                  {teamAPlayers.map((player) => (
                    <li key={player.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => togglePlayerSelection(player.id)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.teamColumn}>
                <h4>Team B</h4>
                <ul className={styles.playerList}>
                  {teamBPlayers.map((player) => (
                    <li key={player.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => togglePlayerSelection(player.id)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button onClick={handleDeletePlayers} className={styles.confirmButton}>
              Confirm Delete
            </button>
            <button onClick={() => setShowDeleteModal(false)} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}