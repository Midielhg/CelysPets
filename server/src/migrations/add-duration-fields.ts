import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Add fullGroomDuration column to breeds table
  await queryInterface.addColumn('breeds', 'fullGroomDuration', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes for full grooming service'
  });

  // Add duration column to additionalservices table
  await queryInterface.addColumn('additionalservices', 'duration', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes for this additional service'
  });
};

export const down = async (queryInterface: QueryInterface) => {
  // Remove the added columns
  await queryInterface.removeColumn('breeds', 'fullGroomDuration');
  await queryInterface.removeColumn('additionalservices', 'duration');
};
