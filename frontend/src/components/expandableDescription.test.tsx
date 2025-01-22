import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpandableDescription } from './expandableDescription';

describe('ExpandableDescription', () => {
    it('should truncate the description if it is longer than 100 characters', () => {
        const longDescription = 'A'.repeat(150); // 150 characters long
        render(<ExpandableDescription description={longDescription} />);

        // Check if the description is truncated
        expect(screen.getByText('A'.repeat(100) + '...')).toBeInTheDocument();
    });

    it('should display "Show More" button if description is truncated', () => {
        const longDescription = 'A'.repeat(150); // 150 characters long
        render(<ExpandableDescription description={longDescription} />);

        // Check if the "Show More" button is shown
        expect(screen.getByText('Show More')).toBeInTheDocument();
    });

    it('should expand the description when "Show More" button is clicked', () => {
        const longDescription = 'A'.repeat(150); // 150 characters long
        render(<ExpandableDescription description={longDescription} />);

        // Click the "Show More" button
        fireEvent.click(screen.getByText('Show More'));

        // Check if the full description is now visible
        expect(screen.getByText(longDescription)).toBeInTheDocument();
        // Check if the "Show Less" button is displayed
        expect(screen.getByText('Show Less')).toBeInTheDocument();
    });

    it('should collapse the description back when "Show Less" button is clicked', () => {
        const longDescription = 'A'.repeat(150); // 150 characters long
        render(<ExpandableDescription description={longDescription} />);

        // Expand the description
        fireEvent.click(screen.getByText('Show More'));

        // Click the "Show Less" button
        fireEvent.click(screen.getByText('Show Less'));

        // Check if the description is truncated again
        expect(screen.getByText('A'.repeat(100) + '...')).toBeInTheDocument();
        // Check if the "Show More" button is displayed again
        expect(screen.getByText('Show More')).toBeInTheDocument();
    });

    it('should display the full description if it is less than or equal to 100 characters', () => {
        const shortDescription = 'A'.repeat(50); // 50 characters long
        render(<ExpandableDescription description={shortDescription} />);

        // Check if the full description is visible
        expect(screen.getByText(shortDescription)).toBeInTheDocument();
        // Check that the "Show More" button is not displayed
        expect(screen.queryByText('Show More')).toBeNull();
    });

    it('should not show the button when description is less than or equal to 100 characters', () => {
        const shortDescription = 'A'.repeat(50); // 50 characters long
        render(<ExpandableDescription description={shortDescription} />);

        // The "Show More" button should not be shown
        expect(screen.queryByText('Show More')).toBeNull();
    });
});
