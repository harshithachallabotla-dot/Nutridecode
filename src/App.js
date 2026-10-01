import React, { useState } from 'react';
import './App.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
  const [showOptions, setShowOptions] = useState(false);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('maintain');
  const [bmrResult, setBmrResult] = useState(null);
  const [foodResult, setFoodResult] = useState(null);
  const [foodError, setFoodError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ age: '', weight: '', height: '' });

  const validateInputs = (age, weight, height) => {
    const newErrors = { age: '', weight: '', height: '' };
    let isValid = true;

    if (!age) newErrors.age = 'Age is required';
    else if (age <= 0 || age > 120) newErrors.age = 'Enter a valid age (1-120)';
    else if (isNaN(age)) newErrors.age = 'Age must be a number';

    if (!weight) newErrors.weight = 'Weight is required';
    else if (weight <= 0 || weight > 500) newErrors.weight = 'Enter a valid weight (1-500 kg)';
    else if (isNaN(weight)) newErrors.weight = 'Weight must be a number';

    if (!height) newErrors.height = 'Height is required';
    else if (height <= 0 || height > 300) newErrors.height = 'Enter a valid height (1-300 cm)';
    else if (isNaN(height)) newErrors.height = 'Height must be a number';

    if (newErrors.age || newErrors.weight || newErrors.height) isValid = false;
    setErrors(newErrors);
    return isValid;
  };

  const calculateBMR = () => {
    if (!validateInputs(age, weight, height)) return;

    const bmrValue = gender === 'male'
      ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };
    const dailyCalories = Math.round(bmrValue * activityFactors[activityLevel]);
    const calorieAdjustment = goal === 'lose' ? -500 : goal === 'gain' ? 500 : 0;
    const adjustedCalories = dailyCalories + calorieAdjustment;

    setBmrResult({
      bmr: Math.round(bmrValue),
      calories: adjustedCalories,
      protein: Math.round((adjustedCalories * 0.25) / 4),
      carbs: Math.round((adjustedCalories * 0.50) / 4),
      fats: Math.round((adjustedCalories * 0.25) / 9),
    });
  };

   const handleFoodUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFoodError('Please select an image file.');
      return;
    }

    setIsLoading(true);
    setFoodError(null);

    const formData = new FormData();
    formData.append('file', file); // match backend key

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setFoodResult(data);
    } catch (error) {
      setFoodError(`Failed to analyze food: ${error.message}`);
      setFoodResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calorieChartData = {
    labels: ['BMR', 'Food'],
    datasets: [
      {
        label: 'Calories',
        data: [bmrResult?.bmr || 0, foodResult?.calories || 0],
        backgroundColor: ['#36A2EB', '#FF6384'],
        borderColor: ['#36A2EB', '#FF6384'],
        borderWidth: 1,
      },
    ],
  };

  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [
      {
        label: 'Macronutrients (g)',
        data: [bmrResult?.protein || 0, bmrResult?.carbs || 0, bmrResult?.fats || 0],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="App">
      {!showOptions ? (
        <main>
          <header className="header">
            <h1 className="nutri-heading">Nutri Decode</h1>
            <img
              src="https://th.bing.com/th/id/OIP.5hXfIyjz-H3yBgEtA1v-uwHaHa?pid=ImgDet&w=199&h=199&c=7&dpr=1.3"
              className="logo radius"
              alt="Nutri Decode nutrition app logo"
            />
          </header>
          <section className="hero">
            <h2>Unlock the Power of Your Plate</h2>
            <p>Transform your nutrition journey with AI-powered insights, personalized meal tracking, and expert recommendations tailored just for you.</p>
            <button
              className="get-started-btn"
              onClick={() => setShowOptions(true)}
              aria-label="Get started with Nutri Decode"
            >
              Get Started
            </button>
          </section>
          <section className="why-choose">
            <h2>Why Choose Nutri Decode?</h2>
            <div className="why-choose-items">
              <article className="why-item">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/004/511/733/original/camera-icon-on-white-background-vector.jpg"
                  alt="Smart Food Scanner icon"
                />
                <h3>Smart Food Scanner</h3>
                <p>Simply snap a photo of your meal and let our AI analyze its nutritional content instantly.</p>
              </article>
              <article className="why-item">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/040/980/903/original/real-time-analytics-icon-line-illustration-vector.jpg"
                  alt="Real-time Analysis icon"
                />
                <h3>Real-time Analysis</h3>
                <p>Get instant insights about your food’s nutritional value and dietary recommendations.</p>
              </article>
              <article className="why-item">
                <img
                  src="https://cdn2.iconfinder.com/data/icons/food-and-nutrition-4/60/diet__plan__clipboard__schedule__food-512.png"
                  alt="Personalized Plans icon"
                />
                <h3>Personalized Plans</h3>
                <p>Receive customized meal plans that align with your goals and preferences.</p>
              </article>
            </div>
          </section>
          <section className="how-it-works">
            <h2>How It Works</h2>
            <div className="how-steps">
              <article className="step">
                <span>1</span>
                <h3>Scan Your Food</h3>
                <p>Take a photo of your meal using our smart scanner.</p>
              </article>
              <article className="step">
                <span>2</span>
                <h3>Get Analysis</h3>
                <p>Receive detailed nutritional information instantly.</p>
              </article>
              <article className="step">
                <span>3</span>
                <h3>Track Progress</h3>
                <p>Monitor your nutrition goals and improve your diet.</p>
              </article>
            </div>
          </section>
          <footer className="footer">
            <h3>Nutri Decode</h3>
            <p>Features | About | Contact</p>
            <p>© 2025 Nutri Decode. All rights reserved.</p>
          </footer>
        </main>
      ) : (
        <main className="options-page">
          <header className="header">
            <h1>Nutri Decode</h1>
            <button
              className="open-app-btn back-to-button"
              onClick={() => setShowOptions(false)}
              aria-label="Return to home page"
            >
              Back to Home
            </button>
          </header>
          <h2 className="family">Your Nutrition Tools</h2>
          <div className="options-container">
            <article className="option-card family">
              <h3>BMR & Macro Calculator</h3>
              <p>Calculate your Basal Metabolic Rate and get personalized macro breakdowns.</p>
              <div>
                <label htmlFor="weight">Weight (kg): </label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    validateInputs(age, e.target.value, height);
                  }}
                  placeholder="Enter weight in kg"
                  aria-label="Weight in kilograms"
                />
                {errors.weight && <span className="error">{errors.weight}</span>}
              </div>
              <div>
                <label htmlFor="height">Height (cm): </label>
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    validateInputs(age, weight, e.target.value);
                  }}
                  placeholder="Enter height in cm"
                  aria-label="Height in centimeters"
                />
                {errors.height && <span className="error">{errors.height}</span>}
              </div>
              <div>
                <label htmlFor="age">Age: </label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    validateInputs(e.target.value, weight, height);
                  }}
                  placeholder="Enter your age"
                  aria-label="Age in years"
                />
                {errors.age && <span className="error">{errors.age}</span>}
              </div>
              <div>
                <label htmlFor="gender">Gender: </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  aria-label="Select gender"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label htmlFor="activityLevel">Activity Level: </label>
                <select
                  id="activityLevel"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  aria-label="Select activity level"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label htmlFor="goal">Goal: </label>
                <select
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  aria-label="Select fitness goal"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>
              <button
                onClick={calculateBMR}
                disabled={errors.age || errors.weight || errors.height || !age || !weight || !height}
                aria-label="Calculate BMR and macros"
              >
                Calculate
              </button>
              {bmrResult && (
                <div>
                  <p>Your BMR: {bmrResult.bmr} calories/day</p>
                  <p>Daily Calories: {bmrResult.calories}</p>
                  <p>Protein: {bmrResult.protein}g</p>
                  <p>Carbs: {bmrResult.carbs}g</p>
                  <p>Fats: {bmrResult.fats}g</p>
                </div>
              )}
            </article>
            <article className="option-card family">
              <h3>Food Scanner</h3>
              <p>Upload a photo of your meal to analyze its nutrition.</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFoodUpload}
                aria-label="Upload food image for analysis"
              />
              {isLoading && <p>Loading...</p>}
              {foodResult && (
                <div>
                  <p>Food: {foodResult.food}</p>
                  <p>Calories: {foodResult.calories}</p>
                  <p>Protein: {foodResult.protein}g</p>
                  <p>Carbs: {foodResult.carbs}g</p>
                  <p>Fats: {foodResult.fats}g</p>
                </div>
              )}
              {foodError && <div className="error">{foodError}</div>}
            </article>
            <article className="option-card family">
              <h3>Nutrition Charts</h3>
              <p>Compare your BMR with food calories and view macronutrient distribution.</p>
              {(bmrResult || foodResult) ? (
                <>
                  <h4>Calorie Comparison</h4>
                  <Bar
                    data={calorieChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Calorie Comparison' },
                      },
                    }}
                  />
                  {bmrResult && (
                    <>
                      <h4>Macronutrient Distribution</h4>
                      <Pie
                        data={macroChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Macronutrient Distribution (grams)' },
                          },
                        }}
                      />
                    </>
                  )}
                </>
              ) : (
                <p>Calculate BMR or scan food to see the charts.</p>
              )}
            </article>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;