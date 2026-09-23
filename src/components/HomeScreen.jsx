import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, Sparkles, Zap, Trophy, Coins, TrendingUp } from 'lucide-react';

export default function HomeScreen({ openModal, stats, setActiveTab }) {
  const userBalance = Number(stats?.balance || 0);
  const hasMinBalance = userBalance >= 5000;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 'daily_tasks',
      tag: '⚡ 8% GUARANTEED RETURN',
      tagColor: '#34d399',
      tagBg: 'rgba(52, 211, 153, 0.25)',
      title: 'DAILY WORK & TASKS',
      subtitle: 'Complete simple tasks & earn 8% instant profit on every deposit!',
      badges: ['✓ Min ₹500', '💰 Up to ₹30,000', '⚡ 8% Bonus'],
      btnText: 'START WORKING NOW',
      btnBg: '#059669',
      bgGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
      imgSrc: '/banner_daily_tasks.jpg',
      action: () => setActiveTab && setActiveTab('deposit')
    },
    {
      id: 'spin_wheel',
      tag: '✨ LIMITED TIME JACKPOT',
      tagColor: '#ffeb3b',
      tagBg: 'rgba(255, 235, 59, 0.2)',
      title: 'LUCKY SPIN WHEEL',
      subtitle: 'Spin the fortune wheel & win up to ₹2,000 cash prizes!',
      badges: ['✓ Guaranteed Prizes', '🎯 Up to ₹2,000', '🎁 Daily Rewards'],
      btnText: hasMinBalance ? 'SPIN NOW!' : 'VIEW WHEEL PERKS',
      btnBg: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      imgSrc: '/banner_spin_rewards.jpg',
      action: () => openModal && openModal('spin')
    },
    {
      id: 'usdt_crypto',
      tag: '🚀 CRYPTO ADVANTAGE',
      tagColor: '#38bdf8',
      tagBg: 'rgba(56, 189, 248, 0.2)',
      title: 'USDT TRC20 DEPOSITS',
      subtitle: 'Exchange USDT at top rate 1 USDT ≈ ₹115 with 8% return!',
      badges: ['✓ 1 USDT ≈ ₹115', '⚡ TRC20 Instant', '🛡️ Zero Slippage'],
      btnText: 'DEPOSIT USDT',
      btnBg: '#0284c7',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      imgSrc: '/banner_crypto_usdt.jpg',
      action: () => setActiveTab && setActiveTab('deposit')
    },
    {
      id: 'team_referral',
      tag: '👑 LIFETIME PASSIVE INCOME',
      tagColor: '#fde047',
      tagBg: 'rgba(253, 224, 71, 0.2)',
      title: 'INVITE & EARN 0.8%',
      subtitle: 'Build your earning team & receive 0.8% lifetime commissions!',
      badges: ['✓ 0.8% Per Recharge', '👥 Unlimited Team', '💸 Auto Payouts'],
      btnText: 'VIEW TEAM REWARDS',
      btnBg: '#d97706',
      bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
      imgSrc: '/banner_referral_team.jpg',
      action: () => setActiveTab && setActiveTab('team')
    }
  ];

  // Auto rotate slides every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const cur = slides[currentSlide];

  return (
    <div className="home-screen">
      {/* Header with FlashPay Logo */}
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <img
          src="/flashpay_logo.png"
          alt="FlashPay Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
          }}
        />
        <h1 className="screen-title" style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
          Flash<span style={{ color: '#2563eb' }}>Pay</span>
        </h1>
      </div>

      {/* Multi-Slide AI-Powered Interactive Carousel Banner */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (!touchStart) return;
          const diff = touchStart - e.changedTouches[0].clientX;
          if (diff > 45) nextSlide();
          else if (diff < -45) prevSlide();
          setTouchStart(null);
        }}
        style={{
          marginBottom: '14px',
          position: 'relative'
        }}
      >
        <div
          onClick={cur.action}
          style={{
            background: cur.bgGradient,
            borderRadius: '18px',
            padding: '16px 18px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            minHeight: '160px',
            boxSizing: 'border-box',
            transition: 'background 0.4s ease'
          }}
        >
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '140px',
            height: '140px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', position: 'relative', zIndex: 2 }}>
            {/* Left Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: cur.tagBg,
                color: cur.tagColor,
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '800',
                marginBottom: '6px',
                letterSpacing: '0.4px'
              }}>
                <Sparkles size={11} color={cur.tagColor} />
                {cur.tag}
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '900', lineHeight: '1.2', color: '#ffffff', margin: 0 }}>
                {cur.title}
              </h2>

              <p style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '600',
                margin: '4px 0 8px 0',
                lineHeight: '1.35',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {cur.subtitle}
              </p>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {cur.badges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '9px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      fontWeight: '700',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>

              {/* CTA Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cur.action();
                }}
                style={{
                  background: cur.btnBg,
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'transform 0.15s ease'
                }}
              >
                {cur.btnText}
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Right Side: AI Generated 3D Image */}
            <div style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              flexShrink: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 22px rgba(0, 0, 0, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.25)'
            }}>
              <img
                src={cur.imgSrc}
                alt={cur.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <ChevronLeft size={15} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <ChevronRight size={15} />
        </button>

        {/* Dot Pagination Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px'
        }}>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: currentSlide === idx ? '22px' : '6px',
                height: '6px',
                borderRadius: '99px',
                background: currentSlide === idx ? '#2563eb' : '#cbd5e1',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Exchange Ratios Box */}
      <div style={{
        background: '#f8f9fa',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        border: '1px solid #edf0f5'
      }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>USDT Ratio</span>
          <div style={{ fontSize: '17px', fontWeight: '800', color: '#000', margin: '4px 0 2px 0' }}>
            1 USDT ≈ 115 INR
          </div>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>Bonus ratio: 2%</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>INR Bonus Ratio</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#000', marginTop: '4px' }}>
            8%
          </div>
        </div>
      </div>

      {/* Top up Banner Button with "First" Ribbon */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <button
          className="btn-black btn-black-lg"
          onClick={() => openModal('topup')}
          style={{
            fontWeight: '800',
            fontSize: '17px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '52px'
          }}
        >
          Top up
        </button>
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '8px',
          background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: '800',
          padding: '3px 10px',
          borderRadius: '12px 12px 12px 0',
          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          pointerEvents: 'none'
        }}>
          <span>🪙 First</span>
        </div>
      </div>

      {/* 2x2 Stats Display (Non-clickable stat cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Balance</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#000' }}>
            {stats.balance.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Today Received</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#000' }}>
            {stats.todayReceived.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Top up Bonus</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#000' }}>
            {stats.topupBonus.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Team Commission</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#000' }}>
            {stats.teamCommission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tutorial Section */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#000', marginBottom: '12px' }}>
          Tutorial
        </h3>

        {/* Freecharge Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 20px',
            marginBottom: '12px',
            cursor: 'pointer'
          }}
          onClick={() => openModal('tutorial', 'FreeCharge')}
        >
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px' }}>
              How to link to FreeCharge?
            </h4>
            <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '500' }}>
              Watch video <ChevronRight size={14} />
            </span>
          </div>

          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: '#ff5722',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            fontSize: '22px',
            boxShadow: '0 4px 10px rgba(255, 87, 34, 0.3)'
          }}>
            <span style={{ fontStyle: 'italic', fontFamily: 'sans-serif' }}>F</span>
          </div>
        </div>

        {/* Indus Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer'
          }}
          onClick={() => openModal('tutorial', 'Indus')}
        >
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px' }}>
              How to link to Indus?
            </h4>
            <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '500' }}>
              Watch video <ChevronRight size={14} />
            </span>
          </div>

          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: '#800020',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            fontSize: '11px',
            textAlign: 'center',
            padding: '4px',
            boxShadow: '0 4px 10px rgba(128, 0, 32, 0.3)'
          }}>
            INDUS BANK
          </div>
        </div>
      </div>
    </div>
  );
}
