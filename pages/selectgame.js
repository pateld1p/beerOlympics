import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';

// team A = Green
// team B = Blue

export default function SelectGame() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Fetch the players from Firebase and split them by team
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const teamA = [];
      const teamB = [];

      querySnapshot.forEach((doc) => {
        const playerData = doc.data();
        if (playerData.team === 'teamA') {
          teamA.push(playerData);
        } else if (playerData.team === 'teamB') {
          teamB.push(playerData);
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

  // Fetch games from Firebase
  useEffect(() => {
    const fetchGames = async () => {
      const gamesCollection = collection(db, "selectGame");
      const gamesSnapshot = await getDocs(gamesCollection);
      const gamesData = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.id,
        teamPoints: doc.data().teamPoints,
        individualPoints: doc.data().individualPoints
      }));
      setGames(gamesData);
    };

    fetchGames();
  }, []);

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
  };

  const handleConfirmGame = () => {
    if (selectedGame) {
      setShowModal(true);  // Open the modal to select players
    }
  };
const handlePlayerSelection = (player) => {
    if (selectedPlayers.includes(player)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleConfirmPlayers = () => {
    // Navigate to the selectwinner page with the game, playersA, and playersB
    router.push({
      pathname: '/selectwinner',
      query: {
        game: selectedGame,
        playersA: JSON.stringify(teamAPlayers.filter(player => selectedPlayers.includes(player.name))),
        playersB: JSON.stringify(teamBPlayers.filter(player => selectedPlayers.includes(player.name))),
      }
    });
  };
 return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select a Game</h2>
      <ul className={styles.gameList}>
        {games.map((game) => (
          <li
            key={game.id}
            className={`${styles.gameItem} ${selectedGame === game.id ? styles.selected : ''}`}
            onClick={() => handleSelectGame(game.id)}
          >
            {game.name}
          </li>
        ))}
      </ul>
      <button
        className={styles.confirmButton}
        onClick={handleConfirmGame}
        disabled={!selectedGame}
      >
        Confirm Game
      </button>

     {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Select Players for {selectedGame}</h3>
            <div className={styles.teamColumns}>
              <div className={styles.teamColumn}>
                <h4>Team Green</h4>
                <ul className={styles.playerList}>
                  {teamAPlayers.map((player, index) => (
                    <li key={index}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.name)}
                          onChange={() => handlePlayerSelection(player.name)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.teamColumn}>
                <h4>Team Blue</h4>
                <ul className={styles.playerList}>
                  {teamBPlayers.map((player, index) => (
                    <li key={index}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.name)}
                          onChange={() => handlePlayerSelection(player.name)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className={styles.confirmButton} onClick={handleConfirmPlayers}>
              Confirm Players
            </button>
            <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}