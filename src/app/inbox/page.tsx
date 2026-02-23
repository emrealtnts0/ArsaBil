"use client";

import React, { useEffect, useState } from 'react';
import styles from './inbox.module.css';

export default function Inbox() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fake logged in user ID
    // In a real scenario, this comes from auth context/session.
    const MY_USER_ID = "mock-id";

    useEffect(() => {
        // API Route hazırlandı ancak mock id ile çalışacak (Test için)
        setTimeout(() => {
            setMessages([
                {
                    id: 1,
                    sender: { name: "Ahmet Yılmaz İnşaat", role: "CONTRACTOR" },
                    content: "Merhaba, Söğütlü'deki %30 arsa paylı teklifinizi gördüm, detaylı konuşabilir miyiz?",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    sender: { name: "Mehmet Demir", role: "CONTRACTOR" },
                    content: "Kâr oranı ve daire paylaşım oranlarınız oldukça makul. Teklifinizi incelemek isterim.",
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gelen Kutusu (DM)</h2>
            </div>

            <div className={styles.messageList}>
                {loading ? (
                    <div>Yükleniyor...</div>
                ) : messages.length === 0 ? (
                    <div>Henüz mesajınız yok.</div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={styles.messageCard}>
                            <div className={styles.senderInfo}>
                                <div className={styles.avatar}>{msg.sender.name.charAt(0)}</div>
                                <div>
                                    <h4>{msg.sender.name}</h4>
                                    <span className={styles.roleLabel}>{msg.sender.role === 'CONTRACTOR' ? 'Müteahhit' : 'Kullanıcı'}</span>
                                </div>
                            </div>
                            <p className={styles.messageContent}>{msg.content}</p>
                            <div className={styles.date}>{new Date(msg.createdAt).toLocaleDateString()}</div>
                            <button className={styles.replyButton}>Yanıtla</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
