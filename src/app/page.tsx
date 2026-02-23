"use client";

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { CalculatorEngine, CalculationParams, CalculationResult } from '@/lib/calculator/engine';
import { RiskGaugeChart } from '@/components/charts/RiskGaugeChart';

export default function Home() {
  // State: Kullanım Girdileri
  const [luxLevel, setLuxLevel] = useState<number>(1.2); // 1: Standart, 1.2: Orta, 1.5: Lüks, 1.8: Süper
  const [apartmentSize, setApartmentSize] = useState<number>(140);
  const [totalApartments, setTotalApartments] = useState<number>(24);
  const [ownerApartmentCount, setOwnerApartmentCount] = useState<number>(8);
  const [landShareRatio, setLandShareRatio] = useState<number>(33); // Yüzde olarak (x)

  const [targetProfit, setTargetProfit] = useState<number>(25); // % (k)
  const [riskMargin, setRiskMargin] = useState<number>(10); // %

  // State: Motor Sonuçları
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Kilit Mekanizması: Daire sayısı kapalıyken sadece yüzde hesabı çalışsın
  const [isApartmentCountEnabled, setIsApartmentCountEnabled] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);

  // Hesabı Tetikle
  useEffect(() => {
    // Kat karşılığı oranından (x) veya daire sayısına göre hesaplama tetiği (Mockuplardaki gibi)
    const activeLandShare = isApartmentCountEnabled
      ? CalculatorEngine.getLandShareFromApartmentCount(ownerApartmentCount, totalApartments)
      : landShareRatio / 100;

    // Yüzde güncellemesi (Kullanıcı arsa payı sliderını görürken senkronize kalsın)
    if (isApartmentCountEnabled) {
      setLandShareRatio(Math.round(activeLandShare * 100));
    } else {
      setOwnerApartmentCount(Math.round(totalApartments * activeLandShare));
    }

    const params: CalculationParams = {
      luxLevelModifier: luxLevel,
      apartmentSizeSqm: apartmentSize,
      totalApartments: isApartmentCountEnabled ? totalApartments : 12, // Daire sayısı kapalıysa standart 12 daire üzerinden referans fiyat çıkart
      landShareRatio: activeLandShare,
      targetProfitMargin: 1 + (targetProfit / 100), // Örn: %25 kar -> 1.25 çarpan
      riskMargin: riskMargin
    };

    const res = CalculatorEngine.calculateAll(params);
    setResult(res);
  }, [luxLevel, apartmentSize, totalApartments, ownerApartmentCount, landShareRatio, targetProfit, riskMargin, isApartmentCountEnabled]);

  const handleSaveReport = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Söğütlü Arsa Analizi - ' + new Date().toLocaleDateString('tr-TR'),
          totalApartments: isApartmentCountEnabled ? totalApartments : 12,
          apartmentSizeSqm: apartmentSize,
          luxLevelModifier: luxLevel,
          landShareRatio: landShareRatio / 100,
          minApartmentPrice: result.minApartmentPrice,
          landCost: result.landCost
        })
      });

      if (response.ok) {
        alert('Rapor başarıyla kaydedildi ve teklife açıldı!');
      } else {
        alert('Kaydetme başarısız oldu.');
      }
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const luxOptions = [
    { label: 'Standart', value: 1.0 },
    { label: 'Orta', value: 1.2 },
    { label: 'Lüks', value: 1.5 },
    { label: 'Süper Lüks', value: 1.8 }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="var(--primary-color)" />
            <path d="M12 8L6 20H18L12 8Z" fill="#fff" />
          </svg>
          <h1 style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>ARSABİL</h1>
        </div>
      </header>

      <main className={styles.main}>
        {/* SOL PANEL (Gösterge & Ayarlar) - Tasarıma Sadık */}
        <aside className={styles.leftPanel}>
          <div className={styles.settingsGroup}>
            <h4>Lüks Seviyesi Seçin</h4>
            <div className={styles.luxGrid}>
              {luxOptions.map(opt => (
                <div
                  key={opt.label}
                  className={`${styles.luxBox} ${luxLevel === opt.value ? styles.luxBoxActive : ''}`}
                  onClick={() => setLuxLevel(opt.value)}
                >
                  <div className={styles.buildingIcon}>🏢</div>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <h4>Daire Metrekaresi</h4>
            <div className={styles.stepperInput}>
              <button onClick={() => setApartmentSize(p => Math.max(50, p - 5))}>−</button>
              <input
                type="number"
                value={apartmentSize}
                onChange={(e) => setApartmentSize(Number(e.target.value))}
              />
              <span>m²</span>
              <button onClick={() => setApartmentSize(p => p + 5)}>+</button>
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Daire Sayısı Gir</h4>
              <Toggle
                checked={isApartmentCountEnabled}
                onChange={(e) => setIsApartmentCountEnabled(e.target.checked)}
              />
            </div>

            {isApartmentCountEnabled && (
              <Input
                type="number"
                label="Toplam Daire Sayısı"
                value={totalApartments}
                onChange={(e) => setTotalApartments(Number(e.target.value))}
              />
            )}
          </div>

          <div className={styles.settingsGroup}>
            <RangeSlider
              label="Kat Karşılığı Oranı (Arsa Payı)"
              min={10} max={60}
              value={landShareRatio}
              onChange={(e) => {
                setLandShareRatio(Number(e.target.value));
                setIsApartmentCountEnabled(false); // Slider ile oynanırsa senkronu kırmak için daire kilidini açarız (veya salt güncelleriz)
              }}
            />
          </div>
        </aside>

        {/* ORTA PANEL (Hesaplama Merkezi & Rapor) */}
        <section className={styles.calculatorSection}>
          <Card className={styles.resultCardMain}>
            <div className={styles.mainPriceBox}>
              <h5>Minimum Daire Fiyatı</h5>
              <h2>
                {result ? result.minApartmentPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0'}
                <span> TL</span>
              </h2>
              <div className={styles.sqmPrice}>
                {result ? result.pricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0'} TL / m²
              </div>
            </div>

            <div className={styles.secondaryStatsGrid}>
              <div className={styles.statBox}>
                <h5>Kaç Daire Arsa Sahibine Verilecek?</h5>
                <div className={styles.statValue}>
                  {isApartmentCountEnabled ? ownerApartmentCount : (result?.apartmentsForLandOwner || 0)} <span>daire</span>
                </div>
                <div className={styles.statSubText}>
                  Yaklaşık Arsa Değeri: {result ? result.landCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0'} TL
                </div>
              </div>
              <div className={styles.statBox} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ transform: 'scale(0.8)', marginTop: '-15px' }}>
                  <RiskGaugeChart
                    score={result ? Math.min(100, Math.max(0, 100 - (result.minApartmentPrice / 200000))) : 50}
                    title="Risk / Satış Skoru"
                  />
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button variant="outline" fullWidth>Detaylı Analiz Grafiği</Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSaveReport}
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Özet Rapor Oluştur & Teklife Aç'}
              </Button>
            </div>
          </Card>
        </section>

        {/* SAĞ PANEL (Gelişmiş & Kâr Ayarları) */}
        <aside className={styles.rightPanel}>
          <Card title="Gelişmiş Ayarlar">
            <div className={styles.settingsGroup}>
              <RangeSlider
                label="Hedef Kâr Oranı"
                min={5} max={50}
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
              />
            </div>
            <div className={styles.settingsGroup}>
              <RangeSlider
                label="Risk Payı"
                min={0} max={30}
                value={riskMargin}
                onChange={(e) => setRiskMargin(Number(e.target.value))}
              />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
            <div className={styles.settingsGroup}>
              <Input
                label="Arsa Sahibine Düşen Daire"
                type="number"
                disabled={!isApartmentCountEnabled}
                value={ownerApartmentCount}
                onChange={(e) => setOwnerApartmentCount(Number(e.target.value))}
                rightElement={<span>daire</span>}
              />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Bu, <strong>%{landShareRatio}</strong> paya denk gelir.
              </div>
            </div>
          </Card>
        </aside>
      </main>
    </div>
  );
}
