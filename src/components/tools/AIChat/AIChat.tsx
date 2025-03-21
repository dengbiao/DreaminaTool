import React from "react";
import { ChatWindow } from "./components/ChatWindow";
import styles from "./AIChat.module.scss";

export const AIChat: React.FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  return (
    <div className={styles.container}>
      <ChatWindow onClose={onClose} />
    </div>
  );
};
